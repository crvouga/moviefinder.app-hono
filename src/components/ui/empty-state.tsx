import type { Child } from 'hono/jsx'

export type EmptyStateProps = {
  title: Child
  description?: Child
  icon?: Child
  action?: Child
  class?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  class: cls,
}: EmptyStateProps) {
  return (
    <div
      class={`flex flex-col items-center rounded-box border border-dashed border-base-300 bg-base-200/40 px-6 py-16 text-center ${cls ?? ''}`.trim()}
    >
      {icon ? (
        <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-base-300 text-2xl text-base-content/40">
          {icon}
        </div>
      ) : null}
      <h3 class="text-lg font-semibold">{title}</h3>
      {description ? (
        <p class="mt-2 max-w-md text-sm text-base-content/60">{description}</p>
      ) : null}
      {action ? <div class="mt-6">{action}</div> : null}
    </div>
  )
}
