import { Hono } from 'hono'
import { getAuth } from './auth'
import { LoginPage } from './login-page'
import { VerifyPage } from './verify-page'
import type { AppEnv } from './types'

export const authRoute = new Hono<AppEnv>()

/** Copy any Set-Cookie headers from a Better Auth response onto our redirect. */
function forwardCookies(from: Headers, to: Response): void {
  for (const cookie of from.getSetCookie()) {
    to.headers.append('set-cookie', cookie)
  }
}

function messageFrom(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === 'string' && m) return m
  }
  return fallback
}

// --- Step 1: phone number ---

authRoute.get('/login', (c) => {
  if (c.get('user')) return c.redirect('/')
  return c.html(<LoginPage />)
})

authRoute.post('/login', async (c) => {
  if (c.get('user')) return c.redirect('/')
  const body = await c.req.parseBody()
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  if (!phoneNumber) {
    return c.html(<LoginPage error="Enter your phone number." />, 400)
  }
  try {
    await getAuth().api.sendPhoneNumberOTP({
      body: { phoneNumber },
      headers: c.req.raw.headers,
    })
  } catch (err) {
    return c.html(
      <LoginPage
        phoneNumber={phoneNumber}
        error={messageFrom(err, 'Failed to send code. Check the number.')}
      />,
      400,
    )
  }
  return c.redirect(`/login/verify?phone=${encodeURIComponent(phoneNumber)}`)
})

// --- Step 2: verification code ---

authRoute.get('/login/verify', (c) => {
  if (c.get('user')) return c.redirect('/')
  const phoneNumber = c.req.query('phone')?.trim() ?? ''
  if (!phoneNumber) return c.redirect('/login')
  return c.html(<VerifyPage phoneNumber={phoneNumber} />)
})

authRoute.post('/login/verify', async (c) => {
  if (c.get('user')) return c.redirect('/')
  const body = await c.req.parseBody()
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  const code = String(body.code ?? '').trim()
  if (!phoneNumber) return c.redirect('/login')
  if (!code) {
    return c.html(
      <VerifyPage phoneNumber={phoneNumber} error="Enter the code we sent." />,
      400,
    )
  }
  try {
    const { headers } = await getAuth().api.verifyPhoneNumber({
      body: { phoneNumber, code },
      headers: c.req.raw.headers,
      returnHeaders: true,
    })
    const res = c.redirect('/')
    forwardCookies(headers, res)
    return res
  } catch (err) {
    return c.html(
      <VerifyPage
        phoneNumber={phoneNumber}
        error={messageFrom(err, 'Invalid or expired code.')}
      />,
      400,
    )
  }
})

// --- Sign out (micro-form in the nav) ---

authRoute.post('/logout', async (c) => {
  try {
    const { headers } = await getAuth().api.signOut({
      headers: c.req.raw.headers,
      returnHeaders: true,
    })
    const res = c.redirect('/')
    forwardCookies(headers, res)
    return res
  } catch {
    return c.redirect('/')
  }
})
