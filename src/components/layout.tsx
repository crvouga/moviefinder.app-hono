import type { Child } from 'hono/jsx'

export type NavUser = { phoneNumber?: string | null } | null

export const Layout = ({
  title,
  children,
  user,
}: {
  title: string
  children: Child
  user?: NavUser
}) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <link rel="stylesheet" href="/public/styles.css" />
    </head>
    <body class="bg-neutral-950 text-neutral-100 min-h-screen">
      <nav class="border-b border-neutral-800 px-4 py-3 flex items-center gap-6">
        <a href="/" class="font-semibold tracking-tight">
          MediaFinder
        </a>
        <a
          href="/trending"
          class="text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          Trending
        </a>
        <a
          href="/lists"
          class="text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          Lists
        </a>
        <div class="ml-auto flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span class="text-neutral-400">
                {user.phoneNumber ?? 'Account'}
              </span>
              <a
                href="#"
                id="signout"
                class="text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                Sign out
              </a>
            </>
          ) : (
            <a
              href="/login"
              class="text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              Sign in
            </a>
          )}
        </div>
      </nav>
      <main class="max-w-5xl mx-auto px-4 py-8">{children}</main>
      <script type="module" src="/public/client.js"></script>
    </body>
  </html>
)
