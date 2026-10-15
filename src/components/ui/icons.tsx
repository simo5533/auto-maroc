import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function IconArrowRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

export function IconChevronLeft(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m15 6-6 6 6 6" />
    </Icon>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 7h16M4 12h16M4 17h10" />
    </Icon>
  );
}

export function IconUser(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function IconSliders(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </Icon>
  );
}

export function IconFuel(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14" />
      <path d="M3 20h12" />
      <path d="M7 9h4" />
      <path d="M14 9h2a2 2 0 0 1 2 2v5a1.5 1.5 0 0 0 3 0V8l-3-3" />
    </Icon>
  );
}

export function IconGearbox(p: IconProps) {
  return (
    <Icon {...p}>
      <circle cx="6" cy="6" r="1.6" />
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="18" cy="6" r="1.6" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="12" cy="18" r="1.6" />
      <path d="M6 7.6v8.8M12 7.6v8.8M18 7.6V12H6" />
    </Icon>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </Icon>
  );
}

export function IconGauge(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M4.5 17a8.5 8.5 0 1 1 15 0" />
      <path d="m12 13 4-5" />
      <circle cx="12" cy="13" r="1.2" />
    </Icon>
  );
}

export function IconCar(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M5 16H3.5a.5.5 0 0 1-.5-.5V13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v2.5a.5.5 0 0 1-.5.5H19" />
      <path d="M3 13h18" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
      <path d="M9.3 16.5h5.4" />
    </Icon>
  );
}

export function IconImage(p: IconProps) {
  return (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m21 16-5-5-8 8" />
    </Icon>
  );
}

export function IconBolt(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8z" />
    </Icon>
  );
}

export function IconExternal(p: IconProps) {
  return (
    <Icon {...p}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Icon>
  );
}
