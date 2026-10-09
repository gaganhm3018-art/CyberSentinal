"use client"

import { Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppState } from "@/components/app/app-state"
import { ActivityList } from "@/components/app/activity-list"

export function ActivityView() {
  const { activity } = useAppState()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-foreground">
            <Activity className="size-5 text-primary" />
            <CardTitle>Activity Log & Audit Trail</CardTitle>
          </div>
          <CardDescription>
            Chronological log of simulated threat events, vulnerability assessments, and remediations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityList events={activity} />
        </CardContent>
      </Card>
    </div>
  )
}
