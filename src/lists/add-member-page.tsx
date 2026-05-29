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

export const AddMemberPage = ({
  list,
  user,
  error,
}: {
  list: MediaList
  user?: NavUser
  error?: string
}) => (
  <Layout title="Invite member — MovieFinder" user={user} activePath="/lists">
    <div class="mx-auto w-full max-w-md">
      <BackLink href={`/lists/${list.list_id}`}>Back to list</BackLink>
      <h1 class="mt-4 text-3xl font-bold tracking-tight">Invite a member</h1>
      <p class="mt-2 text-base-content/60">
        Add someone by their member id to let them edit{' '}
        {list.name ?? 'this list'}.
      </p>
      <Card class="mt-6">
        <CardBody>
          <form
            method="post"
            action={`/lists/${list.list_id}/members`}
            class="flex flex-col gap-4"
          >
            <Field label="Member id" htmlFor="actor_id">
              <TextInput
                id="actor_id"
                name="actor_id"
                type="text"
                placeholder="Member id to invite…"
                autofocus
                required
              />
            </Field>
            <Button type="submit" variant="primary" block>
              Invite member
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
