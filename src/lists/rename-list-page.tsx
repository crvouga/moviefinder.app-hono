import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList } from './queries'
import {
  BackLink,
  Card,
  CardBody,
  Field,
  TextInput,
  Button,
  Alert,
} from '../components/ui'

export const RenameListPage = ({
  list,
  user,
  error,
}: {
  list: MediaList
  user?: NavUser
  error?: string
}) => (
  <Layout title="Rename list — MovieFinder" user={user} activePath="/lists">
    <div class="mx-auto w-full max-w-md">
      <BackLink href={`/lists/${list.list_id}`}>Back to list</BackLink>
      <h1 class="mt-4 text-3xl font-bold tracking-tight">Rename list</h1>
      <Card class="mt-6">
        <CardBody>
          <form
            method="post"
            action={`/lists/${list.list_id}/rename`}
            class="flex flex-col gap-4"
          >
            <Field label="List name" htmlFor="name">
              <TextInput
                id="name"
                name="name"
                type="text"
                value={list.name ?? ''}
                autofocus
                required
              />
            </Field>
            <Button type="submit" variant="primary" block>
              Save
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
