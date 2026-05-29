import type { Child } from 'hono/jsx'

type Variant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'ghost'
  | 'outline'
  | 'success'
  | 'warning'

type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  neutral: 'badge-neutral',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  accent: 'badge-accent',
  ghost: 'badge-ghost',
  outline: 'badge-outline',
  success: 'badge-success',
  warning: 'badge-warning',
}

const sizeClass: Record<Size, string> = {
  sm: 'badge-sm',
  md: '',
  lg: 'badge-lg',
}

export type BadgeProps = {
  children?: Child
  variant?: Variant
  size?: Size
  class?: string
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  class: cls,
}: BadgeProps) {
  const classes = ['badge', variantClass[variant], sizeClass[size], cls ?? '']
    .filter(Boolean)
    .join(' ')
  return <span class={classes}>{children}</span>
}
