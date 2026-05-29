import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import { Card, CardBody, IconFilm } from '../components/ui'

export const LoginPage = ({ user }: { user?: NavUser }) => (
  <Layout title="Sign in — MovieFinder" user={user}>
    <div class="mx-auto mt-6 w-full max-w-md sm:mt-12">
      <div class="mb-6 flex flex-col items-center text-center">
        <span class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-lg">
          <IconFilm class="text-2xl" />
        </span>
        <h1 class="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p class="mt-2 text-base-content/60">
          We&apos;ll text you a one-time code to verify your number.
        </p>
      </div>
      <Card>
        <CardBody>
          <div id="login-root" />
          <noscript>
            <p class="text-sm text-base-content/50">
              JavaScript is required to sign in.
            </p>
          </noscript>
        </CardBody>
      </Card>
    </div>
  </Layout>
)
