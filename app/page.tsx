import { AlertsTable } from "@/components/dashboard/alerts-table"
import { Header } from "@/components/dashboard/header"
import { SeverityBreakdown } from "@/components/dashboard/severity-breakdown"
import { Sidebar } from "@/components/dashboard/sidebar"
import { StatCards } from "@/components/dashboard/stat-cards"
import { ThreatChart } from "@/components/dashboard/threat-chart"

export default function Home() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex flex-col gap-6 p-4 md:p-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">Security overview</h1>
            <p className="text-sm text-muted-foreground">Real-time posture across endpoints, network, and cloud.</p>
          </div>
          <StatCards />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ThreatChart />
            <SeverityBreakdown />
          </div>
          <AlertsTable />
        </main>
      </div>
    </div>
  )
}
