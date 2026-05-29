type IconProps = { class?: string }

const base = (cls?: string) =>
  `inline-block h-[1em] w-[1em] shrink-0 ${cls ?? ''}`.trim()

export function IconSearch({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function IconFilm({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="3" x2="7" y2="21" />
      <line x1="17" y1="3" x2="17" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="7.5" x2="7" y2="7.5" />
      <line x1="3" y1="16.5" x2="7" y2="16.5" />
      <line x1="17" y1="7.5" x2="21" y2="7.5" />
      <line x1="17" y1="16.5" x2="21" y2="16.5" />
    </svg>
  )
}

export function IconStar({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.98l-5.88 3.09 1.12-6.55L2.48 9.88l6.58-.96L12 2.5z" />
    </svg>
  )
}

export function IconPlus({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconClose({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function IconChevronUp({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 15 12 9 18 15" />
    </svg>
  )
}

export function IconChevronDown({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconHome({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export function IconTrending({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </svg>
  )
}

export function IconList({ class: cls }: IconProps) {
  return (
    <svg
      class={base(cls)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
