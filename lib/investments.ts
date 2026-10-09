import type { ControlKey, Dataset, InvestmentOption } from "./types"

function setControl(dataset: Dataset, control: ControlKey): Dataset {
  return {
    ...dataset,
    assets: dataset.assets.map((a) =>
      a.controls[control] === "Active" ? a : { ...a, controls: { ...a.controls, [control]: "Active" } },
    ),
  }
}

export const CRITICAL_REMEDIATION_CVSS = 9

function remediateCritical(dataset: Dataset): Dataset {
  const fixed = dataset.vulnerabilities.filter(
    (v) => !v.remediated && v.patchAvailable && v.cvss >= CRITICAL_REMEDIATION_CVSS,
  )
  const fixedByAsset = new Map<string, number>()
  for (const v of fixed) fixedByAsset.set(v.assetId, (fixedByAsset.get(v.assetId) ?? 0) + 1)
  const fixedIds = new Set(fixed.map((v) => v.id))
  return {
    vulnerabilities: dataset.vulnerabilities.map((v) => (fixedIds.has(v.id) ? { ...v, remediated: true } : v)),
    assets: dataset.assets.map((a) => {
      const count = fixedByAsset.get(a.id)
      if (!count) return a
      return {
        ...a,
        openVulnerabilityCount: Math.max(0, a.openVulnerabilityCount - count),
        controls: { ...a.controls, patching: a.controls.patching === "Missing" ? "Partial" : a.controls.patching },
      }
    }),
  }
}

/**
 * Illustrative investment options. Costs and effects are simulated assumptions,
 * not measured industry benchmarks.
 */
export const investmentOptions: InvestmentOption[] = [
  {
    id: "inv-vuln",
    name: "Critical vulnerability remediation",
    description: `Patch every open finding with CVSS ≥ ${CRITICAL_REMEDIATION_CVSS.toFixed(1)} that has a vendor fix; lifts patch compliance from Missing to Partial on those assets.`,
    cost: 100000,
    effort: "Low",
    riskCategories: ["Vulnerability severity", "Patch compliance"],
    apply: remediateCritical,
  },
  {
    id: "inv-mfa",
    name: "MFA rollout",
    description: "Enforce multi-factor authentication on all identity, admin and remote-access paths.",
    cost: 200000,
    effort: "Medium",
    riskCategories: ["Identity", "Control weakness"],
    apply: (d) => setControl(d, "mfa"),
  },
  {
    id: "inv-edr",
    name: "Endpoint detection and response improvement",
    description: "Extend EDR to uncovered hosts and restore agents that are partial or unavailable.",
    cost: 400000,
    effort: "Medium",
    riskCategories: ["Detection", "Control weakness"],
    apply: (d) => setControl(d, "edr"),
  },
  {
    id: "inv-seg",
    name: "Network segmentation",
    description: "Segment payment, data and identity tiers and restrict east-west traffic.",
    cost: 600000,
    effort: "High",
    riskCategories: ["Lateral movement", "Control weakness"],
    apply: (d) => setControl(d, "segmentation"),
  },
  {
    id: "inv-backup",
    name: "Backup and recovery improvement",
    description: "Isolate backups and complete validated restore testing for critical systems.",
    cost: 300000,
    effort: "Medium",
    riskCategories: ["Resilience", "Control weakness"],
    apply: (d) => setControl(d, "backup"),
  },
]

export const DEFAULT_BUDGET = 1000000
export const DEFAULT_CURRENT_PLAN = ["inv-edr", "inv-backup"]
