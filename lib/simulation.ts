import { assess } from "./risk"
import type { ActivityEvent, ActivityKind, Assessment, Dataset, Severity } from "./types"

export interface ThreatScenario {
  id: string
  kind: ActivityKind
  severity: Severity
  title: string
  cause: string
  assetIds: string[]
  apply: (dataset: Dataset) => Dataset
}

function updateAsset(dataset: Dataset, id: string, patch: (a: Dataset["assets"][number]) => Dataset["assets"][number]): Dataset {
  return { ...dataset, assets: dataset.assets.map((a) => (a.id === id ? patch(a) : a)) }
}

/** Ordered, deterministic scenarios applied one per click. */
export const threatScenarios: ThreatScenario[] = [
  {
    id: "sc-1",
    kind: "vulnerability",
    severity: "Critical",
    title: "New vulnerability detected: DEMO-2026-0147 on Customer Database",
    cause: "Input changed: new open finding (CVSS 9.4, exploitStatus \"Exploited (simulated intel)\", no patch available).",
    assetIds: ["a-cust-db"],
    apply: (d) => ({
      assets: d.assets.map((a) => (a.id === "a-cust-db" ? { ...a, openVulnerabilityCount: a.openVulnerabilityCount + 1 } : a)),
      vulnerabilities: [
        ...d.vulnerabilities,
        {
          id: "v-147",
          demoId: "DEMO-2026-0147",
          title: "Unauthenticated query interface exposed by replication service",
          assetId: "a-cust-db",
          cvss: 9.4,
          exploitStatus: "Exploited (simulated intel)",
          patchAvailable: false,
          remediated: false,
          lastAssessed: new Date().toISOString(),
          remediation: "Disable the replication query interface and restrict access to replication peers until a patch ships.",
        },
      ],
    }),
  },
  {
    id: "sc-2",
    kind: "control",
    severity: "High",
    title: "EDR agent unavailable on Corporate Identity Server",
    cause: "Input changed: controls.edr \"Partial\" → \"Unavailable\".",
    assetIds: ["a-idp"],
    apply: (d) => updateAsset(d, "a-idp", (a) => ({ ...a, controls: { ...a.controls, edr: "Unavailable" } })),
  },
  {
    id: "sc-3",
    kind: "risk-change",
    severity: "High",
    title: "Simulated campaign targeting payment infrastructure",
    cause: "Input changed: threatEvidence raised to 1.00 on Payment API Gateway and Partner Integration Hub.",
    assetIds: ["a-pay-api", "a-partner-hub"],
    apply: (d) =>
      updateAsset(
        updateAsset(d, "a-pay-api", (a) => ({ ...a, threatEvidence: 1 })),
        "a-partner-hub",
        (a) => ({ ...a, threatEvidence: 1 }),
      ),
  },
  {
    id: "sc-4",
    kind: "incident",
    severity: "High",
    title: "High-severity incident opened on HR Application Server",
    cause: "Input changed: openHighSeverityIncidents 0 → 1 and threatEvidence 0.30 → 0.60.",
    assetIds: ["a-hr-app"],
    apply: (d) =>
      updateAsset(d, "a-hr-app", (a) => ({
        ...a,
        openHighSeverityIncidents: a.openHighSeverityIncidents + 1,
        threatEvidence: 0.6,
      })),
  },
  {
    id: "sc-5",
    kind: "control",
    severity: "Medium",
    title: "Backup management interface reachable from partner network",
    cause: "Input changed: exposure \"Internal\" → \"Partner network\" on Backup Infrastructure.",
    assetIds: ["a-backup"],
    apply: (d) => updateAsset(d, "a-backup", (a) => ({ ...a, exposure: "Partner network" })),
  },
]

export interface SimulationOutcome {
  dataset: Dataset
  assessment: Assessment
  event: ActivityEvent
}

export function runScenario(dataset: Dataset, scenario: ThreatScenario, at: string): SimulationOutcome {
  const before = assess(dataset, at)
  const nextDataset = scenario.apply(dataset)
  const after = assess(nextDataset, at)

  const scoreChange = scenario.assetIds.map((id) => {
    const b = before.assetRisks.find((r) => r.asset.id === id)!
    const a = after.assetRisks.find((r) => r.asset.id === id)!
    return { assetName: a.asset.name, before: b.score, after: a.score, rankBefore: b.rank, rankAfter: a.rank }
  })

  const rankText = scoreChange
    .map((c) => `${c.assetName}: ${c.before} → ${c.after} (rank #${c.rankBefore} → #${c.rankAfter})`)
    .join("; ")

  return {
    dataset: nextDataset,
    assessment: after,
    event: {
      id: `evt-${scenario.id}-${at}`,
      at,
      kind: scenario.kind,
      title: scenario.title,
      description: `${scenario.cause} Re-assessed: ${rankText}.`,
      severity: scenario.severity,
      assetId: scenario.assetIds[0],
      scoreChange: scoreChange.map(({ assetName, before, after }) => ({ assetName, before, after })),
      overallChange: { before: before.overallScore, after: after.overallScore },
    },
  }
}
