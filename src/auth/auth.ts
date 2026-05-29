import { betterAuth } from 'better-auth'
import { phoneNumber } from 'better-auth/plugins'
import { db } from '../db'
import { checkVerification, startVerification } from '../twilio/verify'

const baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

export const auth = betterAuth({
  // Reuse the single bun:sqlite connection so there is one DB handle.
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
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
