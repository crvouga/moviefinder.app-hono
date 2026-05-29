import type { Child } from 'hono/jsx'

type Variant = 'error' | 'info' | 'success' | 'warning'

const variantClass: Record<Variant, string> = {
  error: 'alert-error',
  info: 'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
}

export type AlertProps = {
  children?: Child
  variant?: Variant
  class?: string
}

export function Alert({ children, variant = 'error', class: cls }: AlertProps) {
  const classes = ['alert', variantClass[variant], cls ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <div role="alert" class={classes}>
      <span>{children}</span>
    </div>
  )
}
