"use client"

import { Bug, Gauge, Server, Siren, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppState } from "@/components/app/app-state"
import { LevelBadge, scoreBarColor, scoreColor } from "@/components/app/badges"

function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground">no change</span>
  const worse = invert ? value < 0 : value > 0
  return (
    <span className={worse ? "text-destructive" : "text-success"}>
      {value > 0 ? "+" : ""}
      {value} since last run
    </span>
  )
}

function Card({
  label,
  icon: Icon,
  children,
  footer,
}: {
  label: string
  icon: LucideIcon
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="flex items-baseline gap-2">{children}</div>
      <div className="text-xs">{footer}</div>
    </div>
  )
}

export function SummaryCards() {
  const { assessment: a, previousAssessment: p } = useAppState()
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Overall risk score"
        icon={Gauge}
        footer={
          <div className="flex flex-col gap-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className={cn("h-full rounded-full", scoreBarColor(a.overallScore))} style={{ width: `${a.overallScore}%` }} />
            </div>
            {p ? <Delta value={a.overallScore - p.overallScore} /> : <span className="text-muted-foreground">Baseline assessment</span>}
          </div>
        }
      >
        <span className={cn("font-mono text-3xl font-semibold tabular-nums", scoreColor(a.overallScore))}>{a.overallScore}</span>
        <span className="text-sm text-muted-foreground">/100</span>
        <LevelBadge level={a.overallCategory} className="ml-auto" />
      </Card>
      <Card
        label="Critical assets"
        icon={Server}
        footer={<span className="text-muted-foreground">Business criticality: Critical</span>}
      >
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{a.criticalAssetCount}</span>
      </Card>
      <Card
        label="Open vulnerabilities"
        icon={Bug}
        footer={p ? <Delta value={a.openVulnerabilityCount - p.openVulnerabilityCount} /> : <span className="text-muted-foreground">Across all monitored assets</span>}
      >
        <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">{a.openVulnerabilityCount}</span>
      </Card>
      <Card
        label="Open high-severity incidents"
        icon={Siren}
        footer={p ? <Delta value={a.openHighSeverityIncidents - p.openHighSeverityIncidents} /> : <span className="text-muted-foreground">Awaiting containment</span>}
      >
        <span className="font-mono text-3xl font-semibold tabular-nums text-destructive">{a.openHighSeverityIncidents}</span>
      </Card>
    </div>
  )
}
