import type { Child } from 'hono/jsx'

export type BackLinkProps = {
  href: string
  children?: Child
  class?: string
}

export function BackLink({ href, children, class: cls }: BackLinkProps) {
  return (
    <a
      href={href}
      class={`inline-flex items-center gap-1.5 text-sm font-medium text-base-content/60 transition-colors hover:text-base-content ${cls ?? ''}`.trim()}
    >
      <span aria-hidden="true">&larr;</span>
      {children}
    </a>
  )
}
