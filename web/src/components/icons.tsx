/** Small inline SVG icons (no icon library needed for a handful). Decorative: hidden from screen readers. */

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg {...iconProps}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg {...iconProps}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function ArrowUpIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function ArrowDownIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export function ArrowUpDownIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...iconProps} width={16} height={16}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  );
}
