"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useAppState } from "@/components/app/app-state"
import { DemoTag } from "@/components/app/badges"
import { Panel } from "@/components/app/panel"

export function RiskTrend({ className }: { className?: string }) {
  const { assessment, trendHistory } = useAppState()

  // State to hold the live subtle animated offset (mean-reverting around 0)
  const [liveOffset, setLiveOffset] = useState<number>(0)
  const offsetRef = useRef<number>(0)

  // Live simulation update loop: 2-second interval, subtle noise, mean-reverting
  useEffect(() => {
    let isDocVisible = !document.hidden
    const handleVisibility = () => {
      isDocVisible = !document.hidden
    }
    document.addEventListener("visibilitychange", handleVisibility)

    const interval = setInterval(() => {
      if (!isDocVisible) return

      // Ornstein-Uhlenbeck / Mean-Reverting Random Walk:
      // dX = -theta * X + noise
      // theta = 0.35 (pulls offset back toward 0)
      // noise is typically ±0.1 to ±0.4, with occasional step up to ±0.8
      const current = offsetRef.current
      const meanReversionPull = -0.35 * current

      // Generate realistic noise
      const r = Math.random()
      let rawStep: number
      if (r < 0.85) {
        // Normal subtle step between ±0.1 and ±0.4
        rawStep = (Math.random() * 0.5 - 0.25)
      } else {
        // Occasional slightly larger micro-fluctuation (up to ±0.8)
        rawStep = (Math.random() * 1.2 - 0.6)
      }

      // Calculate next bounded offset (bounded strictly within [-1.5, +1.5] around official score)
      let next = current + meanReversionPull + rawStep
      next = Math.max(-1.5, Math.min(1.5, next))
      // Round to 1 decimal place to match score precision
      next = Number(next.toFixed(1))

      offsetRef.current = next
      setLiveOffset(next)
    }, 2000)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  // Calculate live displayed score for "Today"
  const currentLiveScore = useMemo(() => {
    const raw = assessment.overallScore + liveOffset
    return Math.max(0, Math.min(100, Number(raw.toFixed(1))))
  }, [assessment.overallScore, liveOffset])

  const data = useMemo(() => {
    if (!trendHistory || trendHistory.length === 0) {
      return [{ day: "Today", score: currentLiveScore, officialScore: assessment.overallScore }]
    }

    const basePoints = trendHistory.map((pt) => ({
      day: pt.day,
      score: pt.day === "Today" ? currentLiveScore : pt.score,
      officialScore: pt.day === "Today" ? assessment.overallScore : pt.score,
    }))

    const last = basePoints[basePoints.length - 1]
    if (last.day === "Today") {
      return basePoints
    }
    return [...basePoints, { day: "Today", score: currentLiveScore, officialScore: assessment.overallScore }]
  }, [trendHistory, currentLiveScore, assessment.overallScore])

  const first = data[0]?.officialScore ?? assessment.overallScore
  const change = Number((assessment.overallScore - first).toFixed(1))

  return (
    <Panel
      className={className}
      title="Seven-day risk trend"
      description={`Overall risk score ${change >= 0 ? "up" : "down"} ${Math.abs(change)} points over 7 days. Today reflects official assessment score (${assessment.overallScore}/100) with live telemetry.`}
      action={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-emerald-500 font-semibold">Live 2s</span>
          </span>
          <DemoTag />
        </div>
      }
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
              formatter={(v, _name, item) => {
                const payload = item?.payload
                if (payload?.day === "Today") {
                  return [
                    `${v}/100 (Official: ${payload.officialScore})`,
                    "Live Telemetry",
                  ]
                }
                return [`${v}/100`, "Assessed risk"]
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--high)"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={{ r: 3, fill: "var(--high)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
