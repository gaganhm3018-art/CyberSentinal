import { CONTROL_KEYS, CONTROL_LABELS } from "./risk"
import type { Assessment, AssetRisk, RiskFactor, SecurityGap } from "./types"

export const SAMPLE_QUESTION = "Why is the Payment Production Server our highest priority, and what should we do first?"

export interface EvidenceItem {
  field: string
  value: string
  source: string
}

export interface ProposedAction {
  id: string
  title: string
  rationale: string
  expectedEffect: string
}

export interface Investigation {
  assetId: string
  question: string
  summary: string
  priorityStatement: string
  evidence: EvidenceItem[]
  gaps: { title: string; severity: SecurityGap["severity"]; detail: string }[]
  actions: ProposedAction[]
  factors: RiskFactor[]
  score: number
  category: AssetRisk["category"]
  rank: number
  totalAssets: number
}

/**
 * Deterministic, rule-based analysis built from the selected asset's mock data.
 * No language model is involved.
 */
export function investigate(
  assetId: string,
  question: string,
  assessment: Assessment,
  gaps: SecurityGap[],
): Investigation | null {
  const risk = assessment.assetRisks.find((r) => r.asset.id === assetId)
  if (!risk) return null
  const { asset, factors, openVulns, score, category, rank } = risk
  const sortedFactors = factors.toSorted((a, b) => b.contribution - a.contribution)
  const [f1, f2, f3] = sortedFactors
  const next = assessment.assetRisks[rank] as AssetRisk | undefined
  const prev = assessment.assetRisks[rank - 2] as AssetRisk | undefined

  const priorityStatement =
    rank === 1
      ? `Ranked #1 of ${assessment.assetRisks.length} assets with a score of ${score}/100${next ? `, ${score - next.score} points above ${next.asset.name} (${next.score})` : ""}.`
      : `Ranked #${rank} of ${assessment.assetRisks.length} assets with a score of ${score}/100${prev ? `, ${prev.score - score} points below ${prev.asset.name} (${prev.score})` : ""}.`

  const summary = `${asset.name} is a ${asset.criticality.toLowerCase()}-criticality ${asset.type.toLowerCase()} that is ${asset.exposure.toLowerCase()}. Its score of ${score}/100 (${category}) is driven mainly by ${f1.label.toLowerCase()} (${f1.contribution} pts), ${f2.label.toLowerCase()} (${f2.contribution} pts) and ${f3.label.toLowerCase()} (${f3.contribution} pts).`

  const evidence: EvidenceItem[] = [
    { field: "businessCriticality", value: asset.criticality, source: "Asset inventory" },
    { field: "exposure", value: asset.exposure, source: "Asset inventory" },
    { field: "openHighSeverityIncidents", value: String(asset.openHighSeverityIncidents), source: "Incident register" },
    { field: "threatEvidence", value: asset.threatEvidence.toFixed(2), source: "Simulated threat intel" },
    { field: "openVulnerabilityCount", value: String(asset.openVulnerabilityCount), source: "Vulnerability scanner (simulated)" },
    ...openVulns.slice(0, 3).map((v) => ({
      field: v.demoId,
      value: `CVSS ${v.cvss.toFixed(1)} · ${v.exploitStatus} · patch ${v.patchAvailable ? "available" : "not available"}`,
      source: "Vulnerability scanner (simulated)",
    })),
    ...CONTROL_KEYS.filter((k) => asset.controls[k] !== "Active").map((k) => ({
      field: `controls.${k}`,
      value: asset.controls[k],
      source: "Control monitoring (simulated)",
    })),
  ]

  const assetGaps = gaps
    .filter((g) => g.affectedAssets.some((a) => a.id === asset.id))
    .map((g) => ({
      title: g.title,
      severity: g.severity,
      detail: `${CONTROL_LABELS[g.control]} is "${asset.controls[g.control]}" on this asset.`,
    }))

  const actions: ProposedAction[] = []
  const exploitable = openVulns.filter((v) => v.cvss >= 7 && v.exploitStatus !== "None known")
  for (const v of exploitable.slice(0, 2)) {
    actions.push({
      id: `act-${v.id}`,
      title: v.patchAvailable ? `Patch ${v.demoId}` : `Apply compensating control for ${v.demoId}`,
      rationale: `CVSS ${v.cvss.toFixed(1)} with exploitStatus "${v.exploitStatus}" on a ${asset.exposure.toLowerCase()} asset.`,
      expectedEffect: v.remediation,
    })
  }
  if (asset.openHighSeverityIncidents > 0) {
    actions.push({
      id: "act-incident",
      title: "Contain open high-severity incidents",
      rationale: `${asset.openHighSeverityIncidents} high-severity incident(s) remain open on this asset.`,
      expectedEffect: "Isolate affected services, preserve evidence and confirm no persistence.",
    })
  }
  const controlActions: Record<string, string> = {
    mfa: "Enforce MFA for all interactive and administrative access",
    edr: "Restore full EDR coverage and alert on agent health",
    patching: "Bring patch compliance within SLA",
    segmentation: "Move asset into a restricted network segment",
    backup: "Run a validated backup restore test",
  }
  for (const k of CONTROL_KEYS) {
    const status = asset.controls[k]
    if (status === "Missing" || status === "Unavailable") {
      actions.push({
        id: `act-${k}`,
        title: controlActions[k],
        rationale: `controls.${k} is "${status}".`,
        expectedEffect: `Removes up to ${((1 / CONTROL_KEYS.length) * 15).toFixed(1)} pts of control-weakness risk.`,
      })
    }
  }
  if (actions.length === 0) {
    actions.push({
      id: "act-monitor",
      title: "Maintain current controls and monitor",
      rationale: "No exploitable findings or missing controls on this asset.",
      expectedEffect: "Keep the score stable while higher-ranked assets are addressed.",
    })
  }

  return {
    assetId,
    question,
    summary,
    priorityStatement,
    evidence,
    gaps: assetGaps,
    actions: actions.slice(0, 5),
    factors: sortedFactors,
    score,
    category,
    rank,
    totalAssets: assessment.assetRisks.length,
  }
}
