import { Layout } from '../components/layout'
import type { NavUser } from '../components/layout'
import type { MediaList } from './queries'
import {
  PageHeader,
  Badge,
  Button,
  EmptyState,
  IconList,
  IconPlus,
} from '../components/ui'

export const ListsPage = ({
  lists,
  user,
}: {
  lists: MediaList[]
  user?: NavUser
}) => (
  <Layout title="Your lists — MovieFinder" user={user} activePath="/lists">
    <PageHeader
      eyebrow="Collections"
      title="Your lists"
      subtitle="Organize movies and shows you love into shareable collections."
      actions={
        <Button href="/lists/new" variant="primary">
          <IconPlus />
          New list
        </Button>
      }
    />

    {lists.length === 0 ? (
      <EmptyState
        icon={<IconList />}
        title="No lists yet"
        description="Create your first list to start collecting movies and shows."
        action={
          <Button href="/lists/new" variant="primary">
            <IconPlus />
            New list
          </Button>
        }
      />
    ) : (
      <ul class="grid gap-3 sm:grid-cols-2">
        {lists.map((l) => (
          <li key={l.list_id}>
            <a
              href={`/lists/${l.list_id}`}
              class="group flex items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/60 px-5 py-4 transition-colors hover:border-primary/60 hover:bg-base-200"
            >
              <span class="flex min-w-0 items-center gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <IconList class="text-base" />
                </span>
                <span class="truncate font-semibold">
                  {l.name ?? 'Untitled list'}
                </span>
              </span>
              <Badge variant="ghost">
                {l.item_count} {l.item_count === 1 ? 'title' : 'titles'}
              </Badge>
            </a>
          </li>
        ))}
      </ul>
    )}
  </Layout>
)
