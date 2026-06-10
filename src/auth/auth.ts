import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { createAuthDatabase } from '../db'
import { getRuntimeEnv, requireRuntimeEnv } from '../runtime-env'
import { checkVerification, startVerification } from '../twilio/verify'

const LOCAL_DEV_URL = 'http://localhost:8787'

function createAuth() {
  const baseURL = getRuntimeEnv('BETTER_AUTH_URL') ?? LOCAL_DEV_URL

  return betterAuth({
    database: createAuthDatabase(),
    secret: requireRuntimeEnv('BETTER_AUTH_SECRET'),
    baseURL,
    trustedOrigins: [
      'https://www.moviefinder.app',
      'https://moviefinder.app',
      LOCAL_DEV_URL,
    ],
    plugins: [
      phoneNumber({
        // Twilio Verify generates and sends the OTP; the `code` Better Auth would
        // generate is intentionally unused.
        sendOTP: async ({ phoneNumber: to }) => {
          await startVerification(to)
        },
        // Delegate validation to Twilio Verify instead of Better Auth's internal
        // code comparison.
        verifyOTP: async ({ phoneNumber: to, code }) => {
          const { status } = await checkVerification(to, code)
          return status === 'approved'
        },
        signUpOnVerification: {
          getTempEmail: (to) =>
            `${to.replace(/[^0-9]/g, '')}@phone.moviefinder.app`,
        },
      }),
    ],
  })
}

type AuthInstance = ReturnType<typeof createAuth>

let authInstance: AuthInstance | null = null

/** Lazily initialized after runtime env is available. */
export function getAuth(): AuthInstance {
  authInstance ??= createAuth()
  return authInstance
}

export type { AuthInstance }
