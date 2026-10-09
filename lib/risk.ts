import type {
  Asset,
  AssetRisk,
  Assessment,
  ControlKey,
  ControlStatus,
  Criticality,
  Dataset,
  Exposure,
  ExploitStatus,
  RiskCategory,
  RiskFactor,
  SecurityGap,
  SecurityGapDefinition,
  Severity,
  Vulnerability,
} from "./types"

/** Transparent, documented model weights. They sum to 1. */
export const RISK_WEIGHTS = {
  criticality: 0.25,
  exposure: 0.15,
  vulnerability: 0.25,
  threat: 0.1,
  incidents: 0.1,
  controls: 0.15,
} as const

export const CRITICALITY_VALUE: Record<Criticality, number> = { Critical: 1, High: 0.75, Medium: 0.5, Low: 0.25 }
export const EXPOSURE_VALUE: Record<Exposure, number> = { "Internet-facing": 1, "Partner network": 0.6, Internal: 0.3 }
export const EXPLOIT_MULTIPLIER: Record<ExploitStatus, number> = {
  "Exploited (simulated intel)": 1,
  "Public PoC": 0.9,
  "None known": 0.75,
}
export const CONTROL_WEAKNESS: Record<ControlStatus, number> = { Active: 0, Partial: 0.5, Missing: 1, Unavailable: 1 }

export const CONTROL_LABELS: Record<ControlKey, string> = {
  mfa: "Multi-factor authentication",
  edr: "Endpoint detection & response",
  patching: "Patch compliance",
  segmentation: "Network segmentation",
  backup: "Backup recovery testing",
}

export const CONTROL_KEYS: ControlKey[] = ["mfa", "edr", "patching", "segmentation", "backup"]

const INCIDENT_SATURATION = 2

export function severityFromCvss(cvss: number): Severity {
  if (cvss >= 9) return "Critical"
  if (cvss >= 7) return "High"
  if (cvss >= 4) return "Medium"
  return "Low"
}

export function categoryFromScore(score: number): RiskCategory {
  if (score >= 80) return "Critical"
  if (score >= 60) return "High"
  if (score >= 40) return "Medium"
  return "Low"
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function openVulnerabilitiesFor(assetId: string, vulnerabilities: Vulnerability[]) {
  return vulnerabilities
    .filter((v) => v.assetId === assetId && !v.remediated)
    .toSorted((a, b) => b.cvss - a.cvss)
}

function vulnerabilityPressure(vulns: Vulnerability[]) {
  let best = 0
  let driver: Vulnerability | undefined
  for (const v of vulns) {
    const value = (v.cvss / 10) * EXPLOIT_MULTIPLIER[v.exploitStatus]
    if (value > best) {
      best = value
      driver = v
    }
  }
  return { value: best, driver }
}

export function computeFactors(asset: Asset, openVulns: Vulnerability[]): RiskFactor[] {
  const vp = vulnerabilityPressure(openVulns)
  const weakControls = CONTROL_KEYS.filter((k) => asset.controls[k] !== "Active")
  const controlValue = CONTROL_KEYS.reduce((sum, k) => sum + CONTROL_WEAKNESS[asset.controls[k]], 0) / CONTROL_KEYS.length
  const incidentValue = Math.min(1, asset.openHighSeverityIncidents / INCIDENT_SATURATION)

  const raw: Omit<RiskFactor, "contribution">[] = [
    {
      key: "criticality",
      label: "Business criticality",
      weight: RISK_WEIGHTS.criticality,
      value: CRITICALITY_VALUE[asset.criticality],
      detail: `businessCriticality = "${asset.criticality}"`,
    },
    {
      key: "exposure",
      label: "Exposure",
      weight: RISK_WEIGHTS.exposure,
      value: EXPOSURE_VALUE[asset.exposure],
      detail: `exposure = "${asset.exposure}"`,
    },
    {
      key: "vulnerability",
      label: "Vulnerability severity",
      weight: RISK_WEIGHTS.vulnerability,
      value: vp.value,
      detail: vp.driver
        ? `${vp.driver.demoId} CVSS ${vp.driver.cvss.toFixed(1)}, exploitStatus = "${vp.driver.exploitStatus}"`
        : "No open itemised vulnerabilities",
    },
    {
      key: "threat",
      label: "Threat evidence",
      weight: RISK_WEIGHTS.threat,
      value: asset.threatEvidence,
      detail: `threatEvidence = ${asset.threatEvidence.toFixed(2)} (simulated intel)`,
    },
    {
      key: "incidents",
      label: "Open incidents",
      weight: RISK_WEIGHTS.incidents,
      value: incidentValue,
      detail: `openHighSeverityIncidents = ${asset.openHighSeverityIncidents}`,
    },
    {
      key: "controls",
      label: "Control weakness",
      weight: RISK_WEIGHTS.controls,
      value: controlValue,
      detail:
        weakControls.length === 0
          ? "All controls Active"
          : weakControls.map((k) => `${k} = "${asset.controls[k]}"`).join(", "),
    },
  ]

  return raw.map((f) => ({ ...f, contribution: round1(f.value * f.weight * 100) }))
}

export function recommendNextAction(asset: Asset, openVulns: Vulnerability[]): string {
  const exploitable = openVulns.find((v) => v.cvss >= 7 && v.exploitStatus !== "None known" && v.patchAvailable)
  if (exploitable) return `Patch ${exploitable.demoId} (CVSS ${exploitable.cvss.toFixed(1)})`
  if (asset.controls.mfa === "Missing") return "Enforce MFA on all access paths"
  if (asset.openHighSeverityIncidents > 0) return "Contain open high-severity incident"
  if (asset.controls.edr === "Missing" || asset.controls.edr === "Unavailable") return "Restore EDR coverage"
  if (asset.controls.segmentation === "Missing") return "Isolate into restricted network segment"
  if (asset.controls.backup === "Missing") return "Run and validate backup restore test"
  const top = openVulns[0]
  if (top && top.cvss >= 7) return `Remediate ${top.demoId}`
  return "Maintain controls; monitor"
}

export function scoreAsset(asset: Asset, vulnerabilities: Vulnerability[]): Omit<AssetRisk, "rank"> {
  const openVulns = openVulnerabilitiesFor(asset.id, vulnerabilities)
  const factors = computeFactors(asset, openVulns)
  const score = Math.round(factors.reduce((s, f) => s + f.value * f.weight * 100, 0))
  const maxCvss = openVulns[0]?.cvss ?? 0
  return {
    asset,
    score,
    category: categoryFromScore(score),
    factors,
    highestSeverity: openVulns.length ? severityFromCvss(maxCvss) : "None",
    maxCvss,
    openVulns,
    nextAction: recommendNextAction(asset, openVulns),
  }
}

/**
 * Overall organisational risk: 70% mean of the three highest asset scores (concentration risk)
 * plus 30% criticality-weighted mean across the estate.
 */
export function computeOverallScore(scored: { score: number; asset: Asset }[]): number {
  if (scored.length === 0) return 0
  const sorted = scored.map((s) => s.score).toSorted((a, b) => b - a)
  const top = sorted.slice(0, 3)
  const topMean = top.reduce((a, b) => a + b, 0) / top.length
  let wSum = 0
  let wTotal = 0
  for (const s of scored) {
    const w = CRITICALITY_VALUE[s.asset.criticality]
    wSum += s.score * w
    wTotal += w
  }
  const weightedMean = wSum / wTotal
  return Math.round(0.7 * topMean + 0.3 * weightedMean)
}

export function assess(dataset: Dataset, evaluatedAt: string): Assessment {
  const scored = dataset.assets
    .map((a) => scoreAsset(a, dataset.vulnerabilities))
    .toSorted((a, b) => b.score - a.score || a.asset.name.localeCompare(b.asset.name))
  const assetRisks: AssetRisk[] = scored.map((s, i) => ({ ...s, rank: i + 1 }))
  const overallScore = computeOverallScore(scored)
  return {
    evaluatedAt,
    overallScore,
    overallCategory: categoryFromScore(overallScore),
    assetRisks,
    criticalAssetCount: dataset.assets.filter((a) => a.criticality === "Critical").length,
    openVulnerabilityCount: dataset.assets.reduce((s, a) => s + a.openVulnerabilityCount, 0),
    openHighSeverityIncidents: dataset.assets.reduce((s, a) => s + a.openHighSeverityIncidents, 0),
  }
}

/** Criticality-weighted sum of asset risk — the quantity investments try to reduce. */
export function totalRiskExposure(dataset: Dataset): number {
  return dataset.assets.reduce((sum, a) => {
    const { score } = scoreAsset(a, dataset.vulnerabilities)
    return sum + score * CRITICALITY_VALUE[a.criticality]
  }, 0)
}

export function overallScoreFor(dataset: Dataset): number {
  return computeOverallScore(dataset.assets.map((a) => scoreAsset(a, dataset.vulnerabilities)))
}

export function deriveSecurityGaps(dataset: Dataset, definitions: SecurityGapDefinition[]): SecurityGap[] {
  return definitions
    .map((def) => {
      const affected = dataset.assets.filter((a) => a.controls[def.control] !== "Active")
      const urgencyScore = Math.round(
        affected.reduce(
          (s, a) =>
            s +
            CRITICALITY_VALUE[a.criticality] * CONTROL_WEAKNESS[a.controls[def.control]] * (0.5 + EXPOSURE_VALUE[a.exposure] / 2),
          0,
        ) * 10,
      )
      const severity: Severity =
        urgencyScore >= 30 ? "Critical" : urgencyScore >= 20 ? "High" : urgencyScore >= 10 ? "Medium" : "Low"
      const evidence = affected
        .toSorted((a, b) => CRITICALITY_VALUE[b.criticality] - CRITICALITY_VALUE[a.criticality])
        .map((a) => `${def.evidenceTemplate} on ${a.name}: ${def.control} = "${a.controls[def.control]}" (${a.criticality}, ${a.exposure})`)
      return { ...def, affectedAssets: affected, severity, urgencyScore, evidence }
    })
    .filter((g) => g.affectedAssets.length > 0)
    .toSorted((a, b) => b.urgencyScore - a.urgencyScore)
}
