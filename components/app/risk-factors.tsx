import type { RiskFactor } from "@/lib/types"

export function RiskFactorBreakdown({ factors, score }: { factors: RiskFactor[]; score: number }) {
  const max = Math.max(...factors.map((f) => f.weight * 100))
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {factors.map((f) => (
          <li key={f.key}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{f.label}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                <span className="text-foreground">{f.contribution}</span> / {Math.round(f.weight * 100)} pts
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="flex h-full" style={{ width: `${(f.weight * 100 * 100) / max}%` }}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${f.value * 100}%` }} />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground text-pretty">{f.detail}</p>
          </li>
        ))}
      </ul>
      <p className="border-t pt-2 text-xs text-muted-foreground">
        Score = Σ (weight × normalised input) ={" "}
        <span className="font-mono font-semibold text-foreground">{score}/100</span>
      </p>
    </div>
  )
}
