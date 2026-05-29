import type { Child } from 'hono/jsx'
import { IconFilm } from './ui/icon'

export type NavUser = { phoneNumber?: string | null } | null

const navLinks = [
  { href: '/trending', label: 'Trending' },
  { href: '/lists', label: 'Lists' },
]

function avatarLabel(user: NavUser): string {
  const digits = (user?.phoneNumber ?? '').replace(/\D/g, '')
  return digits ? digits.slice(-2) : 'ME'
}

function Brand() {
  return (
    <a
      href="/"
      class="btn btn-ghost gap-2 px-2 text-lg font-bold normal-case tracking-tight"
    >
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-content shadow-sm">
        <IconFilm class="text-lg" />
      </span>
      <span>
        Movie<span class="text-primary">Finder</span>
      </span>
    </a>
  )
}

function AccountMenu({ user }: { user?: NavUser }) {
  if (!user) {
    return (
      <a href="/login" class="btn btn-primary btn-sm">
        Sign in
      </a>
    )
  }
  const label = user.phoneNumber ?? 'Account'
  return (
    <div class="dropdown dropdown-end">
      <div
        tabindex={0}
        role="button"
        class="btn btn-ghost btn-sm gap-2 normal-case"
      >
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
          {avatarLabel(user)}
        </span>
        <span class="hidden max-w-[14ch] truncate sm:inline">{label}</span>
      </div>
      <ul
        tabindex={0}
        class="menu dropdown-content z-50 mt-3 w-56 rounded-box border border-base-300 bg-base-200 p-2 shadow-xl"
      >
        <li class="menu-title truncate">{label}</li>
        <li>
          <a href="/lists">Your lists</a>
        </li>
        <li>
          <a href="#" id="signout" class="text-error">
            Sign out
          </a>
        </li>
      </ul>
    </div>
  )
}

export const Layout = ({
  title,
  children,
  user,
}: {
  title: string
  children: Child
  user?: NavUser
}) => (
  <html lang="en" data-theme="night">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <link rel="stylesheet" href="/public/styles.css" />
    </head>
    <body class="flex min-h-screen flex-col bg-base-100 text-base-content">
      <header class="sticky top-0 z-40 border-b border-base-300 bg-base-200/80 backdrop-blur">
        <div class="navbar mx-auto max-w-6xl px-3 sm:px-4">
          <div class="navbar-start">
            <div class="dropdown">
              <div
                tabindex={0}
                role="button"
                class="btn btn-ghost btn-square lg:hidden"
                aria-label="Open menu"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </div>
              <ul
                tabindex={0}
                class="menu dropdown-content menu-sm z-50 mt-3 w-52 rounded-box border border-base-300 bg-base-200 p-2 shadow-xl"
              >
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <Brand />
          </div>
          <div class="navbar-center hidden lg:flex">
            <ul class="menu menu-horizontal gap-1 px-1 font-medium">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div class="navbar-end gap-2">
            <AccountMenu user={user} />
          </div>
        </div>
      </header>
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10 overflow-y-scroll">
        {children}
      </main>
      <footer class="footer footer-center border-t border-base-300 bg-base-200/40 px-4 py-6 text-base-content/50">
        <aside>
          <p class="flex items-center gap-2 text-sm">
            <IconFilm class="text-base text-primary" />
            <span>
              MovieFinder &middot; Movie &amp; TV data from{' '}
              <a
                href="https://www.themoviedb.org"
                class="link link-hover"
                rel="noreferrer"
              >
                TMDB
              </a>
            </span>
          </p>
        </aside>
      </footer>
      <script type="module" src="/public/client.js"></script>
    </body>
  </html>
)
