import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { pool } from '../db'
import { getRuntimeEnv, requireRuntimeEnv } from '../runtime-env'
import { checkVerification, startVerification } from '../twilio/verify'

const baseURL = getRuntimeEnv('BETTER_AUTH_URL') ?? 'http://localhost:3000'

export const auth = betterAuth({
  database: pool,
  secret: requireRuntimeEnv('BETTER_AUTH_SECRET'),
  baseURL,
  trustedOrigins: [
    'https://www.moviefinder.app',
    'https://moviefinder.app',
    'http://localhost:3000',
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
