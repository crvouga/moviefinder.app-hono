import { createAuthClient } from 'better-auth/client'
import { phoneNumberClient } from 'better-auth/client/plugins'

// Same-origin: baseURL is inferred from window.location in the browser.
export const authClient = createAuthClient({
  plugins: [phoneNumberClient()],
})
