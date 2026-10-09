"use client"

import { cn } from "@/lib/utils"

export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: T[]
  onChange: (next: T[]) => void
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-1.5">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="mr-1 text-xs text-muted-foreground">
        {label}
      </span>
      {options.map((opt) => {
        const active = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((v) => v !== opt) : [...value, opt])}
            className={cn(
              "h-7 rounded-md border px-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            {opt}
          </button>
        )
      })}
    </fieldset>
  )
}
