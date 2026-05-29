import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList } from './queries'
import { BackLink, Card, CardBody, Button } from '../components/ui'

export const DeleteListPage = ({
  list,
  user,
}: {
  list: MediaList
  user?: NavUser
}) => (
  <Layout title="Delete list — MovieFinder" user={user} activePath="/lists">
    <div class="mx-auto w-full max-w-md">
      <BackLink href={`/lists/${list.list_id}`}>Back to list</BackLink>
      <h1 class="mt-4 text-3xl font-bold tracking-tight">Delete list</h1>
      <p class="mt-2 text-base-content/60">
        This permanently deletes{' '}
        <span class="font-semibold">{list.name ?? 'this list'}</span> and its
        contents. This cannot be undone.
      </p>
      <Card class="mt-6">
        <CardBody>
          <form
            method="post"
            action={`/lists/${list.list_id}/delete`}
            class="flex flex-col gap-3"
          >
            <Button type="submit" variant="error" block>
              Delete this list
            </Button>
            <Button href={`/lists/${list.list_id}`} variant="ghost" block>
              Cancel
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  </Layout>
)
