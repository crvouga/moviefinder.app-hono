import type { Child } from 'hono/jsx'

type Size = 'sm' | 'md' | 'lg'

const sizeClass: Record<Size, string> = {
  sm: 'input-sm',
  md: '',
  lg: 'input-lg',
}

export type TextInputProps = {
  id?: string
  name?: string
  type?: string
  value?: string
  placeholder?: string
  size?: Size
  required?: boolean
  disabled?: boolean
  autofocus?: boolean
  autocomplete?: string
  inputmode?:
    | 'none'
    | 'text'
    | 'tel'
    | 'url'
    | 'email'
    | 'numeric'
    | 'decimal'
    | 'search'
  class?: string
  'aria-label'?: string
  onInput?: (e: Event) => void
}

export function TextInput({
  size = 'md',
  class: cls,
  ...rest
}: TextInputProps) {
  const classes = ['input', 'w-full', sizeClass[size], cls ?? '']
    .filter(Boolean)
    .join(' ')
  return <input class={classes} {...rest} />
}

export type FieldProps = {
  label?: Child
  htmlFor?: string
  hint?: Child
  children?: Child
  class?: string
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  class: cls,
}: FieldProps) {
  return (
    <div class={`w-full space-y-1.5 ${cls ?? ''}`.trim()}>
      {label ? (
        <label class="text-sm font-medium" for={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p class="text-xs text-base-content/50">{hint}</p> : null}
    </div>
  )
}
