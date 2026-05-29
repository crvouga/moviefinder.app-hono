import type { Child } from 'hono/jsx'

type Variant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'ghost'
  | 'error'
  | 'outline'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  neutral: 'btn-neutral',
  ghost: 'btn-ghost',
  error: 'btn-error',
  outline: 'btn-outline',
}

const sizeClass: Record<Size, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

export type ButtonProps = {
  children?: Child
  variant?: Variant
  size?: Size
  block?: boolean
  circle?: boolean
  square?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  href?: string
  class?: string
  onClick?: (e: Event) => void
  'aria-label'?: string
  title?: string
}

export function Button({
  children,
  variant = 'neutral',
  size = 'md',
  block,
  circle,
  square,
  loading,
  disabled,
  type = 'button',
  href,
  class: cls,
  onClick,
  'aria-label': ariaLabel,
  title,
}: ButtonProps) {
  const classes = [
    'btn',
    variantClass[variant],
    sizeClass[size],
    block ? 'btn-block' : '',
    circle ? 'btn-circle' : '',
    square ? 'btn-square' : '',
    cls ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading ? <span class="loading loading-spinner loading-sm" /> : null}
      {children}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        class={classes}
        role="button"
        aria-label={ariaLabel}
        title={title}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type={type}
      class={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {content}
    </button>
  )
}
