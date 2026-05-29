import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import {
  Card,
  CardBody,
  Field,
  TextInput,
  Button,
  Alert,
  BackLink,
  IconFilm,
} from '../components/ui'

export const VerifyPage = ({
  user,
  phoneNumber,
  error,
}: {
  user?: NavUser
  phoneNumber: string
  error?: string
}) => (
  <Layout title="Verify code — MovieFinder" user={user}>
    <div class="mx-auto mt-6 w-full max-w-md sm:mt-12">
      <div class="mb-6 flex flex-col items-center text-center">
        <span class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-content shadow-lg">
          <IconFilm class="text-2xl" />
        </span>
        <h1 class="text-3xl font-bold tracking-tight">Enter your code</h1>
        <p class="mt-2 text-base-content/60">Sent to {phoneNumber}</p>
      </div>
      <Card>
        <CardBody>
          <form
            method="post"
            action="/login/verify"
            class="flex flex-col gap-4"
          >
            <input type="hidden" name="phoneNumber" value={phoneNumber} />
            <Field label="Verification code" htmlFor="code">
              <TextInput
                id="code"
                name="code"
                type="text"
                inputmode="numeric"
                placeholder="123456"
                autocomplete="one-time-code"
                autofocus
                required
              />
            </Field>
            <Button type="submit" variant="primary" block>
              Verify
            </Button>
          </form>
          {error ? (
            <Alert variant="error" class="mt-4">
              {error}
            </Alert>
          ) : null}
          <div class="mt-4 text-center">
            <BackLink href="/login">Use a different number</BackLink>
          </div>
        </CardBody>
      </Card>
    </div>
  </Layout>
)
