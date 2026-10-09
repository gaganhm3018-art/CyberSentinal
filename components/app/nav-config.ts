import { Activity, BrainCircuit, LayoutDashboard, Server, Settings, ShieldAlert, Wallet, type LucideIcon } from "lucide-react"
import type { ViewId } from "@/lib/types"

export interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
  title: string
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Executive Overview",
    icon: LayoutDashboard,
    title: "Executive Overview",
    description: "Organisation-wide cyber risk posture, top exposures and recommended actions.",
  },
  {
    id: "explorer",
    label: "Asset & Vulnerability Explorer",
    icon: Server,
    title: "Asset & Vulnerability Explorer",
    description: "Search and filter assets and findings; inspect what drives each risk score.",
  },
  {
    id: "analyst",
    label: "AI Risk Analyst",
    icon: BrainCircuit,
    title: "AI Risk Analyst",
    description: "Investigate an asset's risk with a deterministic, evidence-backed simulated analysis.",
  },
  {
    id: "investments",
    label: "Investment Optimizer",
    icon: Wallet,
    title: "Investment Optimizer",
    description: "Allocate a constrained security budget to the investments that reduce the most risk.",
  },
  {
    id: "gaps",
    label: "Security Gaps",
    icon: ShieldAlert,
    title: "Security Gaps",
    description: "Prioritised control weaknesses with evidence, consequences and remediation.",
  },
  {
    id: "activity",
    label: "Activity Log",
    icon: Activity,
    title: "Activity Log",
    description: "Chronological record of simulated security events and assessments.",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    title: "Settings",
    description: "Risk model assumptions, data sources and demo controls.",
  },
]
