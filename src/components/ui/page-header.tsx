import type { Child } from 'hono/jsx'

export type PageHeaderProps = {
  title: Child
  subtitle?: Child
  eyebrow?: Child
  actions?: Child
  class?: string
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  class: cls,
}: PageHeaderProps) {
  return (
    <div
      class={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${cls ?? ''}`.trim()}
    >
      <div class="min-w-0">
        {eyebrow ? (
          <p class="mb-1 text-sm font-medium uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p class="mt-2 max-w-2xl text-base-content/60">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div class="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
