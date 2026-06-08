const TWILIO_VERIFY_BASE = 'https://verify.twilio.com/v2'

interface TwilioCreds {
  accountSid: string
  authToken: string
  serviceSid: string
}

function getCreds(): TwilioCreds {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const serviceSid = process.env.TWILIO_SERVICE_SID
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error(
      'Twilio Verify is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID required via Vault)',
    )
  }
  return { accountSid, authToken, serviceSid }
}

/** Twilio Verify boundary: POST form-encoded with Basic auth. */
async function verifyFetch(
  creds: TwilioCreds,
  path: string,
  body: Record<string, string>,
): Promise<any> {
  const url = `${TWILIO_VERIFY_BASE}/Services/${creds.serviceSid}${path}`
  const auth = btoa(`${creds.accountSid}:${creds.authToken}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(body).toString(),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `Twilio Verify request failed: ${res.status} ${res.statusText} ${detail}`,
    )
  }
  return res.json()
}

/** Start an SMS verification: Twilio generates and sends the OTP. */
export async function startVerification(
  phoneNumber: string,
): Promise<{ status: string }> {
  const creds = getCreds()
  const result = await verifyFetch(creds, '/Verifications', {
    To: phoneNumber,
    Channel: 'sms',
  })
  return { status: result.status }
}

/** Check a submitted OTP. Returns the Twilio verification status (e.g. "approved"). */
export async function checkVerification(
  phoneNumber: string,
  code: string,
): Promise<{ status: string }> {
  const creds = getCreds()
  const result = await verifyFetch(creds, '/VerificationCheck', {
    To: phoneNumber,
    Code: code,
  })
  return { status: result.status }
}
