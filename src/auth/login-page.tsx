import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'

export const LoginPage = ({ user }: { user?: NavUser }) => (
  <Layout title="Sign in — MediaFinder" user={user}>
    <h1 class="text-3xl font-semibold tracking-tight mb-2">Sign in</h1>
    <p class="text-neutral-400 mb-6">
      We'll text you a one-time code to verify your number.
    </p>
    <div id="login-root" />
    <noscript>
      <p class="text-neutral-500 text-sm">JavaScript is required to sign in.</p>
    </noscript>
  </Layout>
)
