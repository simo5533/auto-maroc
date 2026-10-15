"use client";

import { IconChevronDown } from "@/components/ui/icons";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}) {
  const active = value !== "";
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full cursor-pointer appearance-none rounded-[10px] border bg-carbon/80 ps-3.5 pe-9 text-[13px] font-medium transition hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
          active ? "border-accent/50 text-fg" : "border-line text-fg-muted"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <IconChevronDown size={15} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-steel" />
    </label>
  );
}
