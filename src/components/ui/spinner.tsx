type Size = 'xs' | 'sm' | 'md' | 'lg'

const sizeClass: Record<Size, string> = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
}

export type SpinnerProps = {
  size?: Size
  class?: string
}

export function Spinner({ size = 'md', class: cls }: SpinnerProps) {
  const classes = ['loading', 'loading-spinner', sizeClass[size], cls ?? '']
    .filter(Boolean)
    .join(' ')
  return <span class={classes} role="status" aria-label="Loading" />
}

export function LoadingRow({ label = 'Loading…' }: { label?: string }) {
  return (
    <div class="flex items-center gap-3 py-4 text-sm text-base-content/60">
      <Spinner size="sm" />
      <span>{label}</span>
    </div>
  )
}
