/** Ikony 1:1 z designu (stroke 1.7, viewBox 24). */
type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  'aria-hidden': true,
});

export function DashboardIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
    </svg>
  );
}

export function ProfileIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}

export function DiaryIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 4h10a1 1 0 0 1 1 1v15H8a1 1 0 0 1-1-1V4z" />
      <path d="M7 4a2 2 0 0 0-2 2v12" />
      <path d="M10.5 9h5M10.5 13h5" />
    </svg>
  );
}

export function ActivityIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M3 12h4l2.5 6 4-13 2.5 7H21" />
    </svg>
  );
}

export function MedsIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3.5" y="9" width="17" height="6" rx="3" />
      <path d="M12 9v6" />
    </svg>
  );
}

export function NotesIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 7h14M5 12h14M5 17h9" />
    </svg>
  );
}

export function ProjectsIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 7a2 2 0 0 1 2-2h3.2l1.8 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

export function CalendarIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function TodoIcon({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 6.5l1.4 1.4L8 5.4M4 12.5l1.4 1.4L8 11.4M4 18.5l1.4 1.4L8 17.4" />
      <path d="M11 7h9M11 13h9M11 19h8" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function TrashIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.8}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}

export function SunIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.9}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
    </svg>
  );
}

export function MoonIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.9}>
      <path d="M20 14.2A8 8 0 1 1 9.8 4 6.4 6.4 0 0 0 20 14.2z" />
    </svg>
  );
}

export function WrenchIcon({ size = 26 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.6}>
      <path d="M14.7 6.3a4.5 4.5 0 0 0 5.9 5.9l-8.3 8.3a2.1 2.1 0 0 1-3-3l8.3-8.3z" />
      <path d="M14.7 6.3 17.5 3.5" />
    </svg>
  );
}

export function PinIcon({ size = 13, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(size)} strokeWidth={1.8} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 17v5M8 4h8l-1 7 3 2H6l3-2-1-7z" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 15 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function BoltIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.8}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

export function StepsIcon({ size = 16 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={1.8}>
      <path d="M6 20c-1.5-2-2-4-1.5-6.5C5 11 6 9.5 6 7a3 3 0 0 1 6 0c0 2 .5 3 .5 3M17 20c1.2-1.6 1.7-3.6 1.3-5.7-.4-1.8-1.3-2.8-1.3-5.3a3 3 0 0 0-5.6-1.4" />
    </svg>
  );
}

export function XIcon({ size = 13 }: IconProps) {
  return (
    <svg {...base(size)} strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
