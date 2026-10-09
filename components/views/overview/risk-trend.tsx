"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAppState } from "@/components/app/app-state"
import { DemoTag } from "@/components/app/badges"
import { Panel } from "@/components/app/panel"
import { riskTrendHistory } from "@/lib/mock-data"

export function RiskTrend({ className }: { className?: string }) {
  const { assessment } = useAppState()
  const data = useMemo(() => [...riskTrendHistory, { day: "Today", score: assessment.overallScore }], [assessment.overallScore])
  const first = data[0].score
  const change = assessment.overallScore - first

  return (
    <Panel
      className={className}
      title="Seven-day risk trend"
      description={`Overall risk score ${change >= 0 ? "up" : "down"} ${Math.abs(change)} points over 7 days. Today reflects the latest assessment.`}
      action={<DemoTag />}
    >
      <div className="h-56" role="img" aria-label={`Risk trend: ${data.map((d) => `${d.day} ${d.score}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--high)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--high)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis
              domain={[50, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <ReferenceLine
              y={80}
              stroke="var(--destructive)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: "Critical", fill: "var(--destructive)", fontSize: 10, position: "insideTopRight" }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--foreground)" }}
              itemStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v) => [`${v}/100`, "Overall risk"]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--high)"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={{ r: 3, fill: "var(--high)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
