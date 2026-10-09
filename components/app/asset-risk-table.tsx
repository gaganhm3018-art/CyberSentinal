"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { AssetRisk, Criticality, Severity } from "@/lib/types"
import { ExposureText, LevelBadge, RiskScore } from "./badges"
import { EmptyState } from "./panel"

type SortKey = "rank" | "name" | "type" | "criticality" | "exposure" | "severity" | "score"

const CRIT_ORDER: Record<Criticality, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }
const SEV_ORDER: Record<Severity | "None", number> = { Critical: 4, High: 3, Medium: 2, Low: 1, None: 0 }
const EXPOSURE_ORDER = { "Internet-facing": 3, "Partner network": 2, Internal: 1 } as const

function compare(a: AssetRisk, b: AssetRisk, key: SortKey) {
  switch (key) {
    case "rank":
      return a.rank - b.rank
    case "name":
      return a.asset.name.localeCompare(b.asset.name)
    case "type":
      return a.asset.type.localeCompare(b.asset.type)
    case "criticality":
      return CRIT_ORDER[a.asset.criticality] - CRIT_ORDER[b.asset.criticality]
    case "exposure":
      return EXPOSURE_ORDER[a.asset.exposure] - EXPOSURE_ORDER[b.asset.exposure]
    case "severity":
      return SEV_ORDER[a.highestSeverity] - SEV_ORDER[b.highestSeverity]
    case "score":
      return a.score - b.score
  }
}

export function AssetRiskTable({
  risks,
  onSelect,
  selectedId,
  limit,
  compact = false,
}: {
  risks: AssetRisk[]
  onSelect?: (assetId: string) => void
  selectedId?: string | null
  limit?: number
  compact?: boolean
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "rank", dir: "asc" })

  const rows = useMemo(() => {
    const sorted = risks.toSorted((a, b) => {
      const c = compare(a, b, sort.key)
      return sort.dir === "asc" ? c : -c
    })
    return limit ? sorted.slice(0, limit) : sorted
  }, [risks, sort, limit])

  const toggle = (key: SortKey) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "type" || key === "rank" ? "asc" : "desc" },
    )

  if (risks.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-5" aria-hidden="true" />}
        title="No assets match"
        description="Adjust the search or filters to see more assets."
      />
    )
  }

  const header = (key: SortKey, label: string, className?: string) => {
    const active = sort.key === key
    const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
    return (
      <TableHead
        className={className}
        aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          type="button"
          onClick={() => toggle(key)}
          className={cn(
            "-mx-1 inline-flex items-center gap-1 rounded px-1 text-xs font-medium hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
            active ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
          <Icon className="size-3" aria-hidden="true" />
        </button>
      </TableHead>
    )
  }

  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {header("rank", "#", "w-10")}
          {header("name", "Asset")}
          {compact ? null : header("type", "Type", "hidden md:table-cell")}
          {header("criticality", "Criticality", "hidden sm:table-cell")}
          {header("exposure", "Exposure", "hidden lg:table-cell")}
          {header("severity", "Top severity", "hidden md:table-cell")}
          {header("score", "Risk score")}
          <TableHead className="hidden text-xs text-muted-foreground sm:table-cell">Category</TableHead>
          {compact ? null : (
            <TableHead className="hidden text-xs text-muted-foreground xl:table-cell">Recommended next action</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow
            key={r.asset.id}
            data-state={selectedId === r.asset.id ? "selected" : undefined}
            className={cn(onSelect && "cursor-pointer")}
            onClick={onSelect ? () => onSelect(r.asset.id) : undefined}
          >
            <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">{r.rank}</TableCell>
            <TableCell className="max-w-56">
              {onSelect ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(r.asset.id)
                  }}
                  className="truncate text-left font-medium text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {r.asset.name}
                </button>
              ) : (
                <span className="font-medium">{r.asset.name}</span>
              )}
              <span className="block truncate text-xs text-muted-foreground md:hidden">{r.asset.type}</span>
            </TableCell>
            {compact ? null : (
              <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{r.asset.type}</TableCell>
            )}
            <TableCell className="hidden sm:table-cell">
              <LevelBadge level={r.asset.criticality} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <ExposureText exposure={r.asset.exposure} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <LevelBadge level={r.highestSeverity} />
            </TableCell>
            <TableCell>
              <RiskScore score={r.score} />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <LevelBadge level={r.category} />
            </TableCell>
            {compact ? null : (
              <TableCell className="hidden max-w-72 text-xs whitespace-normal text-muted-foreground xl:table-cell">
                {r.nextAction}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
