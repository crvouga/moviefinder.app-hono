import type { Child, FC } from 'hono/jsx'
import { IconFilm, IconHome, IconTrending, IconList } from './ui/icon'

export type NavUser = { phoneNumber?: string | null } | null

type DockLink = {
  href: string
  label: string
  icon: FC<{ class?: string }>
}

const dockLinks: DockLink[] = [
  { href: '/', label: 'Home', icon: IconHome },
  { href: '/trending', label: 'Trending', icon: IconTrending },
  { href: '/lists', label: 'Lists', icon: IconList },
]

function isActive(linkHref: string, activePath?: string): boolean {
  if (!activePath) return false
  if (linkHref === '/') return activePath === '/'
  return activePath === linkHref || activePath.startsWith(`${linkHref}/`)
}

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
        <li class="p-0">
          <form method="post" action="/logout" class="p-0">
            <button type="submit" class="w-full px-4 py-2 text-left text-error">
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </div>
  )
}

function TopNav({ activePath }: { activePath?: string }) {
  return (
    <ul class="menu menu-horizontal gap-1 px-1 font-medium">
      {dockLinks.map((link) => {
        const Icon = link.icon
        const active = isActive(link.href, activePath)
        return (
          <li key={link.href}>
            <a
              href={link.href}
              class={active ? 'menu-active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <Icon class="text-base" />
              {link.label}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

function Dock({ activePath }: { activePath?: string }) {
  return (
    <nav class="dock z-40 border-t border-base-300 bg-base-200/95 backdrop-blur lg:hidden">
      {dockLinks.map((link) => {
        const Icon = link.icon
        const active = isActive(link.href, activePath)
        return (
          <a
            key={link.href}
            href={link.href}
            class={active ? 'dock-active' : ''}
            aria-label={link.label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon class="text-xl" />
            <span class="dock-label">{link.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

export const Layout = ({
  title,
  children,
  user,
  activePath,
}: {
  title: string
  children: Child
  user?: NavUser
  activePath?: string
}) => (
  <html lang="en" data-theme="night">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <link rel="stylesheet" href="/styles.css" />
      <script
        type="module"
        src="https://cdn.jsdelivr.net/gh/starfederation/datastar@v1.0.1/bundles/datastar.js"
      ></script>
    </head>
    <body class="flex min-h-screen flex-col bg-base-100 pb-24 text-base-content lg:pb-0">
      <header class="sticky top-0 z-30 border-b border-base-300 bg-base-200/80 backdrop-blur">
        <div class="navbar mx-auto max-w-6xl px-3 sm:px-4">
          <div class="navbar-start">
            <Brand />
          </div>
          <div class="navbar-center hidden lg:flex">
            <TopNav activePath={activePath} />
          </div>
          <div class="navbar-end gap-2">
            <AccountMenu user={user} />
          </div>
        </div>
      </header>
      <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
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
      <Dock activePath={activePath} />
    </body>
  </html>
)
