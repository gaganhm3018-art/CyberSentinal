"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppState } from "@/components/app/app-state"
import { AssetRiskTable } from "@/components/app/asset-risk-table"
import { AssetDetail } from "@/components/app/asset-detail"
import { FilterChips } from "@/components/app/filter-chips"
import { EmptyState, Panel } from "@/components/app/panel"
import { severityFromCvss } from "@/lib/risk"
import type { Criticality, Exposure, Severity } from "@/lib/types"
import { VulnerabilityTable, type VulnRow } from "./explorer/vulnerability-table"
import { VulnerabilityDetail } from "./explorer/vulnerability-detail"

const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const satisfies readonly Severity[]
const CRITICALITIES = ["Critical", "High", "Medium", "Low"] as const satisfies readonly Criticality[]
const EXPOSURES = ["Internet-facing", "Partner network", "Internal"] as const satisfies readonly Exposure[]

type Selection = { kind: "asset"; id: string } | { kind: "vuln"; id: string } | null

export function ExplorerView() {
  const { assessment, dataset } = useAppState()
  const [query, setQuery] = useState("")
  const q = useDeferredValue(query).trim().toLowerCase()
  const [severity, setSeverity] = useState<Severity[]>([])
  const [criticality, setCriticality] = useState<Criticality[]>([])
  const [exposure, setExposure] = useState<Exposure[]>([])
  const [tab, setTab] = useState<"vulns" | "assets">("vulns")
  const [selection, setSelection] = useState<Selection>(null)

  const assetRisks = useMemo(
    () =>
      assessment.assetRisks.filter((r) => {
        const a = r.asset
        if (criticality.length && !criticality.includes(a.criticality)) return false
        if (exposure.length && !exposure.includes(a.exposure)) return false
        if (severity.length && (r.highestSeverity === "None" || !severity.includes(r.highestSeverity))) return false
        if (q && !`${a.name} ${a.type} ${a.owner}`.toLowerCase().includes(q)) return false
        return true
      }),
    [assessment.assetRisks, criticality, exposure, severity, q],
  )

  const vulnRows = useMemo<VulnRow[]>(() => {
    const byId = new Map(dataset.assets.map((a) => [a.id, a]))
    return dataset.vulnerabilities.flatMap((v) => {
      const asset = byId.get(v.assetId)
      if (!asset) return []
      const sev = severityFromCvss(v.cvss)
      if (severity.length && !severity.includes(sev)) return []
      if (criticality.length && !criticality.includes(asset.criticality)) return []
      if (exposure.length && !exposure.includes(asset.exposure)) return []
      if (q && !`${v.demoId} ${v.title} ${asset.name}`.toLowerCase().includes(q)) return []
      return [{ vuln: v, asset, severity: sev }]
    })
  }, [dataset, severity, criticality, exposure, q])

  const hasFilters = !!(query || severity.length || criticality.length || exposure.length)
  const clear = () => {
    setQuery("")
    setSeverity([])
    setCriticality([])
    setExposure([])
  }

  const selectedAsset = selection?.kind === "asset" ? assessment.assetRisks.find((r) => r.asset.id === selection.id) : undefined
  const selectedVuln = selection?.kind === "vuln" ? dataset.vulnerabilities.find((v) => v.id === selection.id) : undefined

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by asset, owner, demo ID or finding title…"
                aria-label="Search assets and vulnerabilities"
                className="pl-8"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={clear} disabled={!hasFilters}>
              <RotateCcw aria-hidden="true" />
              Clear
            </Button>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:gap-x-6">
            <FilterChips label="Severity" options={SEVERITIES} value={severity} onChange={setSeverity} />
            <FilterChips label="Criticality" options={CRITICALITIES} value={criticality} onChange={setCriticality} />
            <FilterChips label="Exposure" options={EXPOSURES} value={exposure} onChange={setExposure} />
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="vulns">
              Vulnerabilities <span className="ml-1 font-mono text-xs text-muted-foreground">{vulnRows.length}</span>
            </TabsTrigger>
            <TabsTrigger value="assets">
              Assets <span className="ml-1 font-mono text-xs text-muted-foreground">{assetRisks.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="vulns">
            <div className="rounded-lg border bg-card px-2">
              <VulnerabilityTable
                rows={vulnRows}
                selectedId={selection?.kind === "vuln" ? selection.id : null}
                onSelect={(id) => setSelection({ kind: "vuln", id })}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Itemised high-impact findings only. Demo identifiers are fictional and do not correspond to real CVEs.
            </p>
          </TabsContent>
          <TabsContent value="assets">
            <div className="rounded-lg border bg-card px-2">
              <AssetRiskTable
                risks={assetRisks}
                compact
                selectedId={selection?.kind === "asset" ? selection.id : null}
                onSelect={(id) => setSelection({ kind: "asset", id })}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Panel
        title={selectedAsset ? selectedAsset.asset.name : selectedVuln ? selectedVuln.demoId : "Details"}
        description={selectedAsset ? "Asset detail" : selectedVuln ? "Vulnerability detail" : undefined}
        className="xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:self-start"
        bodyClassName="overflow-y-auto"
      >
        {selectedAsset ? (
          <AssetDetail risk={selectedAsset} />
        ) : selectedVuln ? (
          <VulnerabilityDetail vuln={selectedVuln} onSelectAsset={(id) => setSelection({ kind: "asset", id })} />
        ) : (
          <EmptyState title="Nothing selected" description="Select a vulnerability or asset row to inspect its details." />
        )}
      </Panel>
    </div>
  )
}
