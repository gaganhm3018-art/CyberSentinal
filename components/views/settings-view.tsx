"use client"

import { Settings, RefreshCw, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppState } from "@/components/app/app-state"

export function SettingsView() {
  const { reset, simulateThreat, scenariosRemaining, isAssessing } = useAppState()

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-foreground">
            <Settings className="size-5 text-primary" />
            <CardTitle>Demonstration & Model Settings</CardTitle>
          </div>
          <CardDescription>
            Configure risk model parameters, run threat scenario simulations, or reset demonstration state.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
              <Zap className="size-4 text-warning" /> Simulate Threat Incident
            </h4>
            <p className="text-xs text-muted-foreground">
              Inject a simulated threat scenario into the current dataset ({scenariosRemaining} scenario(s) available in sequence).
            </p>
            <Button onClick={simulateThreat} disabled={isAssessing || scenariosRemaining <= 0} size="sm">
              Run Threat Simulation
            </Button>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-destructive">
              <RefreshCw className="size-4" /> Reset Simulation State
            </h4>
            <p className="text-xs text-muted-foreground">
              Reset all asset states, vulnerabilities, and activity history to baseline initial demonstration values.
            </p>
            <Button variant="outline" onClick={reset} size="sm" className="text-destructive border-destructive/30">
              Reset Demo Dataset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
