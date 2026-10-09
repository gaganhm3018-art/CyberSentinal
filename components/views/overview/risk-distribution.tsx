"use client"

import { useMemo } from "react"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAppState } from "@/components/app/app-state"
import { Panel } from "@/components/app/panel"
import type { RiskCategory } from "@/lib/types"

const CATEGORIES: { key: RiskCategory; color: string }[] = [
  { key: "Critical", color: "var(--destructive)" },
  { key: "High", color: "var(--high)" },
  { key: "Medium", color: "var(--warning)" },
  { key: "Low", color: "var(--success)" },
]

export function RiskDistribution() {
  const { assessment } = useAppState()
  const data = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        category: c.key,
        color: c.color,
        count: assessment.assetRisks.filter((r) => r.category === c.key).length,
      })),
    [assessment.assetRisks],
  )

  return (
    <Panel title="Risk distribution" description={`${assessment.assetRisks.length} assets by risk category`}>
      <div className="h-44" role="img" aria-label={data.map((d) => `${d.category}: ${d.count}`).join(", ")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="category"
              width={60}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)" }}
              itemStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v) => [`${v} assets`, "Count"]}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={18}>
              {data.map((d) => (
                <Cell key={d.category} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 grid grid-cols-4 gap-2 border-t pt-3">
        {data.map((d) => (
          <li key={d.category} className="flex flex-col">
            <span className="font-mono text-lg font-semibold tabular-nums text-foreground">{d.count}</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: d.color }} aria-hidden="true" />
              {d.category}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
