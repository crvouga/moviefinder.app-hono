import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import {
  BackLink,
  Card,
  CardBody,
  Field,
  TextInput,
  Button,
  Alert,
  IconPlus,
} from '../components/ui'

export const CreateListPage = ({
  user,
  error,
}: {
  user?: NavUser
  error?: string
}) => (
  <Layout title="New list — MovieFinder" user={user} activePath="/lists">
    <div class="mx-auto w-full max-w-md">
      <BackLink href="/lists">All lists</BackLink>
      <h1 class="mt-4 text-3xl font-bold tracking-tight">Create a list</h1>
      <p class="mt-2 text-base-content/60">
        Give your collection a name to get started.
      </p>
      <Card class="mt-6">
        <CardBody>
          <form method="post" action="/lists" class="flex flex-col gap-4">
            <Field label="List name" htmlFor="name">
              <TextInput
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Weekend watchlist"
                autofocus
                required
              />
            </Field>
            <Button type="submit" variant="primary" block>
              <IconPlus />
              Create list
            </Button>
          </form>
          {error ? (
            <Alert variant="error" class="mt-4">
              {error}
            </Alert>
          ) : null}
        </CardBody>
      </Card>
    </div>
  </Layout>
)
