import { ArrowRight, Bug, CheckCircle2, Gauge, ShieldOff, Siren, TrendingUp, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import type { ActivityEvent, ActivityKind } from "@/lib/types"
import { LevelBadge, scoreColor } from "./badges"
import { EmptyState } from "./panel"

const KIND_ICON: Record<ActivityKind, LucideIcon> = {
  vulnerability: Bug,
  "risk-change": TrendingUp,
  control: ShieldOff,
  remediation: CheckCircle2,
  assessment: Gauge,
  incident: Siren,
}

const KIND_COLOR: Record<ActivityKind, string> = {
  vulnerability: "text-destructive",
  "risk-change": "text-high",
  control: "text-warning",
  remediation: "text-success",
  assessment: "text-muted-foreground",
  incident: "text-destructive",
}

export function ActivityList({ events, compact = false }: { events: ActivityEvent[]; compact?: boolean }) {
  if (events.length === 0) {
    return <EmptyState title="No activity yet" description="Simulated events will appear here." />
  }
  return (
    <ol className="divide-y">
      {events.map((e) => {
        const Icon = KIND_ICON[e.kind]
        return (
          <li key={e.id} className="flex gap-3 py-3">
            <span
              className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted", KIND_COLOR[e.kind])}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                {e.severity !== "Info" ? <LevelBadge level={e.severity} /> : null}
              </div>
              <p className={cn("mt-0.5 text-xs text-muted-foreground text-pretty", compact && "line-clamp-2")}>
                {e.description}
              </p>
              {!compact && (e.scoreChange?.length || e.overallChange) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {e.scoreChange?.map((c) => (
                    <ScoreDelta key={c.assetName} label={c.assetName} before={c.before} after={c.after} />
                  ))}
                  {e.overallChange ? (
                    <ScoreDelta label="Overall risk" before={e.overallChange.before} after={e.overallChange.after} />
                  ) : null}
                </div>
              ) : null}
              <p className="mt-1 font-mono text-[11px] text-muted-foreground">{formatDateTime(e.at)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function ScoreDelta({ label, before, after }: { label: string; before: number; after: number }) {
  const diff = after - before
  return (
    <span className="inline-flex items-center gap-1.5 rounded border bg-background px-2 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono tabular-nums", scoreColor(before))}>{before}</span>
      <ArrowRight className="size-3 text-muted-foreground" aria-label="to" />
      <span className={cn("font-mono font-semibold tabular-nums", scoreColor(after))}>{after}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          diff > 0 ? "text-destructive" : diff < 0 ? "text-success" : "text-muted-foreground",
        )}
      >
        ({diff > 0 ? "+" : ""}
        {diff})
      </span>
    </span>
  )
}
