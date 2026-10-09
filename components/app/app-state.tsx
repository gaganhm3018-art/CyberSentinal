"use client"

import { createContext, use, useCallback, useMemo, useReducer, useRef, type ReactNode } from "react"
import { initialActivity, initialDataset, securityGapDefinitions, SIMULATED_BASE_TIME } from "@/lib/mock-data"
import { assess, deriveSecurityGaps } from "@/lib/risk"
import { runScenario, threatScenarios } from "@/lib/simulation"
import type { ActivityEvent, Assessment, Dataset, SecurityGap, ViewId } from "@/lib/types"

interface State {
  view: ViewId
  dataset: Dataset
  assessment: Assessment
  previousAssessment: Assessment | null
  activity: ActivityEvent[]
  scenarioIndex: number
  isAssessing: boolean
  isStale: boolean
  unread: number
  analystAssetId: string | null
  lastSimulation: ActivityEvent | null
}

type Action =
  | { type: "navigate"; view: ViewId; analystAssetId?: string }
  | { type: "assess-start" }
  | { type: "assess-complete"; at: string }
  | { type: "simulate"; at: string }
  | { type: "record-remediation"; vulnerabilityId: string; at: string }
  | { type: "mark-read" }
  | { type: "reset" }

function initState(): State {
  return {
    view: "overview",
    dataset: initialDataset,
    assessment: assess(initialDataset, SIMULATED_BASE_TIME),
    previousAssessment: null,
    activity: initialActivity,
    scenarioIndex: 0,
    isAssessing: false,
    isStale: false,
    unread: 2,
    analystAssetId: null,
    lastSimulation: null,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "navigate":
      return { ...state, view: action.view, analystAssetId: action.analystAssetId ?? state.analystAssetId }
    case "assess-start":
      return { ...state, isAssessing: true }
    case "assess-complete": {
      const next = assess(state.dataset, action.at)
      const delta = next.overallScore - state.assessment.overallScore
      const event: ActivityEvent = {
        id: `evt-assess-${action.at}`,
        at: action.at,
        kind: "assessment",
        title: "Risk assessment completed",
        description: `Re-scored ${next.assetRisks.length} assets from the simulated dataset. Overall risk ${state.assessment.overallScore} → ${next.overallScore}${delta === 0 ? " (no change)" : ""}.`,
        severity: "Info",
        overallChange: { before: state.assessment.overallScore, after: next.overallScore },
      }
      return {
        ...state,
        previousAssessment: state.assessment,
        assessment: next,
        isAssessing: false,
        isStale: false,
        activity: [event, ...state.activity],
        unread: state.unread + 1,
      }
    }
    case "simulate": {
      const scenario = threatScenarios[state.scenarioIndex]
      if (!scenario) return { ...state, isAssessing: false }
      const outcome = runScenario(state.dataset, scenario, action.at)
      return {
        ...state,
        dataset: outcome.dataset,
        previousAssessment: state.assessment,
        assessment: outcome.assessment,
        activity: [outcome.event, ...state.activity],
        scenarioIndex: state.scenarioIndex + 1,
        isAssessing: false,
        isStale: false,
        unread: state.unread + 1,
        lastSimulation: outcome.event,
      }
    }
    case "record-remediation": {
      const vuln = state.dataset.vulnerabilities.find((v) => v.id === action.vulnerabilityId)
      if (!vuln || vuln.remediated) return state
      const asset = state.dataset.assets.find((a) => a.id === vuln.assetId)
      const dataset: Dataset = {
        vulnerabilities: state.dataset.vulnerabilities.map((v) => (v.id === vuln.id ? { ...v, remediated: true } : v)),
        assets: state.dataset.assets.map((a) =>
          a.id === vuln.assetId ? { ...a, openVulnerabilityCount: Math.max(0, a.openVulnerabilityCount - 1) } : a,
        ),
      }
      const event: ActivityEvent = {
        id: `evt-rem-${vuln.id}-${action.at}`,
        at: action.at,
        kind: "remediation",
        title: `Remediation recorded: ${vuln.demoId}`,
        description: `${vuln.title} marked remediated on ${asset?.name ?? "asset"}. Run a risk assessment to update rankings.`,
        severity: "Info",
        assetId: vuln.assetId,
      }
      return { ...state, dataset, isStale: true, activity: [event, ...state.activity], unread: state.unread + 1 }
    }
    case "mark-read":
      return { ...state, unread: 0 }
    case "reset":
      return { ...initState(), view: state.view }
  }
}

interface AppContextValue extends State {
  gaps: SecurityGap[]
  scenariosRemaining: number
  navigate: (view: ViewId, analystAssetId?: string) => void
  runAssessment: () => void
  simulateThreat: () => void
  recordRemediation: (vulnerabilityId: string) => void
  markRead: () => void
  reset: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

const ASSESSMENT_DELAY_MS = 600

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const busy = useRef(false)

  const withAssessment = useCallback((complete: (at: string) => Action) => {
    if (busy.current) return
    busy.current = true
    dispatch({ type: "assess-start" })
    window.setTimeout(() => {
      dispatch(complete(new Date().toISOString()))
      busy.current = false
    }, ASSESSMENT_DELAY_MS)
  }, [])

  const navigate = useCallback((view: ViewId, analystAssetId?: string) => {
    dispatch({ type: "navigate", view, analystAssetId })
    window.scrollTo({ top: 0 })
  }, [])
  const runAssessment = useCallback(() => withAssessment((at) => ({ type: "assess-complete", at })), [withAssessment])
  const simulateThreat = useCallback(() => withAssessment((at) => ({ type: "simulate", at })), [withAssessment])
  const recordRemediation = useCallback(
    (vulnerabilityId: string) => dispatch({ type: "record-remediation", vulnerabilityId, at: new Date().toISOString() }),
    [],
  )
  const markRead = useCallback(() => dispatch({ type: "mark-read" }), [])
  const reset = useCallback(() => dispatch({ type: "reset" }), [])

  const gaps = useMemo(() => deriveSecurityGaps(state.dataset, securityGapDefinitions), [state.dataset])

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      gaps,
      scenariosRemaining: threatScenarios.length - state.scenarioIndex,
      navigate,
      runAssessment,
      simulateThreat,
      recordRemediation,
      markRead,
      reset,
    }),
    [state, gaps, navigate, runAssessment, simulateThreat, recordRemediation, markRead, reset],
  )

  return <AppContext value={value}>{children}</AppContext>
}

export function useAppState() {
  const ctx = use(AppContext)
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider")
  return ctx
}
