import { APEX_PLACEHOLDER_IP, WWW_HOST, WWW_PROXIED, ZONE } from './config'
import { requireEnv } from './env'
import { isDryRun, log } from './shell'

const STEP = 'cloudflare'
const API_BASE = 'https://api.cloudflare.com/client/v4'
const REDIRECT_PHASE = 'http_request_dynamic_redirect'
const REDIRECT_REF = 'apex_to_www_redirect'

// Cloudflare REST responses are an external boundary; shapes are intentionally loose.
interface CfResponse<T> {
  success: boolean
  errors: { code: number; message: string }[]
  result: T
}

interface DnsRecord {
  id: string
  type: string
  name: string
  content: string
  proxied?: boolean
}

interface RulesetRule {
  ref?: string
  expression: string
  action: string
  description?: string
  action_parameters?: unknown
}

interface Ruleset {
  id: string
  rules?: RulesetRule[]
}

async function cf<T>(path: string, init?: RequestInit): Promise<T> {
  const token = requireEnv('CLOUDFLARE_API_TOKEN')
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const body = (await res.json()) as CfResponse<T>
  if (!res.ok || !body.success) {
    const detail =
      body.errors?.map((e) => `${e.code} ${e.message}`).join('; ') ??
      res.statusText
    throw new Error(`Cloudflare API ${path} failed: ${detail}`)
  }
  return body.result
}

let cachedZoneId: string | null = null

export async function getZoneId(): Promise<string> {
  if (cachedZoneId) return cachedZoneId
  const zones = await cf<{ id: string; name: string }[]>(
    `/zones?name=${encodeURIComponent(ZONE)}`,
  )
  const zone = zones.find((z) => z.name === ZONE)
  if (!zone) {
    throw new Error(
      `Cloudflare zone not found for ${ZONE} (is the domain on this account?)`,
    )
  }
  cachedZoneId = zone.id
  log(STEP, `zone ${ZONE} -> ${zone.id}`)
  return zone.id
}

export interface DnsRecordInput {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT'
  name: string
  content: string
  proxied?: boolean
}

export async function upsertDnsRecord(record: DnsRecordInput): Promise<void> {
  const zoneId = await getZoneId()
  const existing = await cf<DnsRecord[]>(
    `/zones/${zoneId}/dns_records?type=${record.type}&name=${encodeURIComponent(record.name)}`,
  )

  const payload = {
    type: record.type,
    name: record.name,
    content: record.content,
    proxied: record.proxied ?? false,
    ttl: 1,
  }

  const current = existing[0]
  const verb = current ? 'update' : 'create'
  log(
    STEP,
    `${verb} DNS ${record.type} ${record.name} -> ${record.content} (proxied=${payload.proxied})`,
  )
  if (isDryRun()) {
    log(STEP, '(dry-run: skipped)')
    return
  }

  if (current) {
    await cf(`/zones/${zoneId}/dns_records/${current.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  } else {
    await cf(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}

async function getRedirectEntrypoint(zoneId: string): Promise<Ruleset | null> {
  try {
    return await cf<Ruleset>(
      `/zones/${zoneId}/rulesets/phases/${REDIRECT_PHASE}/entrypoint`,
    )
  } catch {
    return null
  }
}

/** Create or update the apex -> www 301 redirect rule, preserving other rules. */
export async function upsertRedirectRule(): Promise<void> {
  const zoneId = await getZoneId()

  const rule: RulesetRule = {
    ref: REDIRECT_REF,
    description: 'Redirect apex moviefinder.app to www.moviefinder.app',
    expression: `http.host eq "${ZONE}"`,
    action: 'redirect',
    action_parameters: {
      from_value: {
        target_url: {
          expression: `concat("https://${WWW_HOST}", http.request.uri.path)`,
        },
        status_code: 301,
        preserve_query_string: true,
      },
    },
  }

  const entrypoint = await getRedirectEntrypoint(zoneId)
  log(
    STEP,
    `${entrypoint ? 'update' : 'create'} ${REDIRECT_PHASE} ruleset (apex -> www)`,
  )
  if (isDryRun()) {
    log(STEP, '(dry-run: skipped)')
    return
  }

  if (entrypoint) {
    const others = (entrypoint.rules ?? []).filter(
      (r) => r.ref !== REDIRECT_REF,
    )
    await cf(`/zones/${zoneId}/rulesets/phases/${REDIRECT_PHASE}/entrypoint`, {
      method: 'PUT',
      body: JSON.stringify({ rules: [...others, rule] }),
    })
  } else {
    await cf(`/zones/${zoneId}/rulesets`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Redirect rules',
        kind: 'zone',
        phase: REDIRECT_PHASE,
        rules: [rule],
      }),
    })
  }
}

/** Configure all DNS records for the deployment. */
export async function configureDns(
  ipv6: string | null,
  cert: { name?: string; value?: string; type?: 'CNAME' | 'TXT' },
): Promise<void> {
  if (ipv6) {
    await upsertDnsRecord({
      type: 'AAAA',
      name: WWW_HOST,
      content: ipv6,
      proxied: WWW_PROXIED,
    })
  } else {
    log(STEP, 'no IPv6 available; skipping www AAAA record')
  }

  // Apex must be proxied for the redirect rule to run; traffic is intercepted
  // by the rule before reaching the placeholder address.
  await upsertDnsRecord({
    type: 'A',
    name: ZONE,
    content: APEX_PLACEHOLDER_IP,
    proxied: true,
  })

  if (cert.name && cert.value) {
    // Validation records must be DNS-only so the raw value is returned.
    await upsertDnsRecord({
      type: cert.type ?? 'TXT',
      name: cert.name,
      content: cert.value,
      proxied: false,
    })
  }
}
