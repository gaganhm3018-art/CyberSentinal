"use client"

import { BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONTROL_KEYS, CONTROL_LABELS } from "@/lib/risk"
import { formatDateTime } from "@/lib/format"
import type { AssetRisk } from "@/lib/types"
import { useAppState } from "./app-state"
import { ControlStatusText, DemoTag, ExposureText, LevelBadge, RiskScore } from "./badges"
import { RiskFactorBreakdown } from "./risk-factors"
import { severityFromCvss } from "@/lib/risk"

export function AssetDetail({ risk }: { risk: AssetRisk }) {
  const { navigate } = useAppState()
  const { asset } = risk
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={risk.category} />
        <span className="text-xs text-muted-foreground">
          Rank #{risk.rank} · {asset.type}
        </span>
        <RiskScore score={risk.score} className="ml-auto" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="mt-0.5 text-foreground">{asset.owner}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Criticality</dt>
          <dd className="mt-0.5">
            <LevelBadge level={asset.criticality} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Exposure</dt>
          <dd className="mt-0.5">
            <ExposureText exposure={asset.exposure} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Open findings</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground">{asset.openVulnerabilityCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">High-severity incidents</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground">{asset.openHighSeverityIncidents}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Threat evidence</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-foreground">{asset.threatEvidence.toFixed(2)}</dd>
        </div>
      </dl>

      <section aria-labelledby={`ctrl-${asset.id}`}>
        <h3 id={`ctrl-${asset.id}`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Control status
        </h3>
        <ul className="divide-y rounded-md border">
          {CONTROL_KEYS.map((k) => (
            <li key={k} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="text-foreground">{CONTROL_LABELS[k]}</span>
              <ControlStatusText status={asset.controls[k]} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`why-${asset.id}`}>
        <h3 id={`why-${asset.id}`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Why this score
        </h3>
        <RiskFactorBreakdown factors={risk.factors} score={risk.score} />
      </section>

      <section aria-labelledby={`vulns-${asset.id}`}>
        <h3 id={`vulns-${asset.id}`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Itemised open findings ({risk.openVulns.length})
        </h3>
        {risk.openVulns.length === 0 ? (
          <p className="text-xs text-muted-foreground">No itemised open findings.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {risk.openVulns.map((v) => (
              <li key={v.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-foreground">{v.demoId}</span>
                  <DemoTag />
                  <LevelBadge level={severityFromCvss(v.cvss)} />
                  <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">CVSS {v.cvss.toFixed(1)}</span>
                </div>
                <p className="mt-1.5 text-xs text-foreground">{v.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {v.exploitStatus} · {v.patchAvailable ? "Patch available" : "No patch"} · {formatDateTime(v.lastAssessed)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-md border bg-muted/40 p-3">
        <p className="text-xs font-medium text-foreground">Recommended next action</p>
        <p className="mt-1 text-xs text-muted-foreground text-pretty">{risk.nextAction}</p>
      </div>

      <Button variant="outline" onClick={() => navigate("analyst", asset.id)}>
        <BrainCircuit aria-hidden="true" />
        Investigate in AI Risk Analyst
      </Button>
    </div>
  )
}
