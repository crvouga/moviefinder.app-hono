import type { Child } from 'hono/jsx'

export type CardProps = {
  children?: Child
  class?: string
}

export function Card({ children, class: cls }: CardProps) {
  return (
    <div
      class={`card border border-base-300 bg-base-200/60 shadow-sm ${cls ?? ''}`.trim()}
    >
      {children}
    </div>
  )
}

export function CardBody({ children, class: cls }: CardProps) {
  return <div class={`card-body ${cls ?? ''}`.trim()}>{children}</div>
}

export function CardTitle({ children, class: cls }: CardProps) {
  return <h2 class={`card-title ${cls ?? ''}`.trim()}>{children}</h2>
}
