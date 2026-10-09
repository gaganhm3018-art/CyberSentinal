import { overallScoreFor, totalRiskExposure } from "./risk"
import type { Dataset, Effort, InvestmentOption } from "./types"

export const EFFORT_UNITS: Record<Effort, number> = { Low: 1, Medium: 2, High: 3 }
/** Exposure points subtracted per effort unit — a tie-breaker that favours easier work. */
export const EFFORT_PENALTY = 2

export interface PlanEvaluation {
  optionIds: string[]
  totalCost: number
  baselineExposure: number
  residualExposure: number
  reduction: number
  reductionPct: number
  baselineOverall: number
  residualOverall: number
  effortUnits: number
  objective: number
}

export interface OptionInsight {
  option: InvestmentOption
  standaloneReduction: number
  standalonePct: number
  efficiencyPerLakh: number
  coverage: number
  marginalReduction: number | null
  selected: boolean
}

export interface OptimizationResult {
  budget: number
  proposed: PlanEvaluation
  insights: OptionInsight[]
  combinationsEvaluated: number
  feasibleCombinations: number
  overlapAdjustment: number
}

export function applyPlan(dataset: Dataset, options: InvestmentOption[]): Dataset {
  return options.reduce((d, opt) => opt.apply(d), dataset)
}

export function evaluatePlan(dataset: Dataset, all: InvestmentOption[], optionIds: string[]): PlanEvaluation {
  const chosen = all.filter((o) => optionIds.includes(o.id))
  const after = applyPlan(dataset, chosen)
  const baselineExposure = totalRiskExposure(dataset)
  const residualExposure = totalRiskExposure(after)
  const reduction = baselineExposure - residualExposure
  const effortUnits = chosen.reduce((s, o) => s + EFFORT_UNITS[o.effort], 0)
  return {
    optionIds: chosen.map((o) => o.id),
    totalCost: chosen.reduce((s, o) => s + o.cost, 0),
    baselineExposure,
    residualExposure,
    reduction,
    reductionPct: baselineExposure ? (reduction / baselineExposure) * 100 : 0,
    baselineOverall: overallScoreFor(dataset),
    residualOverall: overallScoreFor(after),
    effortUnits,
    objective: reduction - EFFORT_PENALTY * effortUnits,
  }
}

function countChangedAssets(before: Dataset, after: Dataset) {
  let changed = 0
  for (let i = 0; i < before.assets.length; i++) {
    const b = before.assets[i]
    const a = after.assets[i]
    const vulnChanged = after.vulnerabilities.some(
      (v, j) => v.assetId === b.id && v.remediated !== before.vulnerabilities[j]?.remediated,
    )
    if (JSON.stringify(b.controls) !== JSON.stringify(a.controls) || vulnChanged) changed++
  }
  return changed
}

/**
 * Exhaustive search over every combination of options (2^n). Risk reduction is
 * measured by re-scoring the dataset with all chosen investments applied together,
 * so overlapping benefits are never double-counted.
 */
export function optimizeBudget(dataset: Dataset, options: InvestmentOption[], budget: number): OptimizationResult {
  const n = options.length
  let best: PlanEvaluation | null = null
  let feasible = 0

  for (let mask = 0; mask < 1 << n; mask++) {
    const ids = options.filter((_, i) => mask & (1 << i)).map((o) => o.id)
    const cost = options.reduce((s, o, i) => (mask & (1 << i) ? s + o.cost : s), 0)
    if (cost > budget) continue
    feasible++
    const evaluation = evaluatePlan(dataset, options, ids)
    if (
      !best ||
      evaluation.objective > best.objective + 1e-9 ||
      (Math.abs(evaluation.objective - best.objective) <= 1e-9 && evaluation.totalCost < best.totalCost)
    ) {
      best = evaluation
    }
  }

  const proposed = best ?? evaluatePlan(dataset, options, [])
  const baseline = totalRiskExposure(dataset)

  const insights: OptionInsight[] = options.map((option) => {
    const after = option.apply(dataset)
    const standaloneReduction = baseline - totalRiskExposure(after)
    const selected = proposed.optionIds.includes(option.id)
    let marginalReduction: number | null = null
    if (selected) {
      const without = evaluatePlan(
        dataset,
        options,
        proposed.optionIds.filter((id) => id !== option.id),
      )
      marginalReduction = proposed.reduction - without.reduction
    }
    return {
      option,
      standaloneReduction,
      standalonePct: baseline ? (standaloneReduction / baseline) * 100 : 0,
      efficiencyPerLakh: standaloneReduction / (option.cost / 100000),
      coverage: countChangedAssets(dataset, after),
      marginalReduction,
      selected,
    }
  })

  const standaloneSum = insights.filter((i) => i.selected).reduce((s, i) => s + i.standaloneReduction, 0)

  return {
    budget,
    proposed,
    insights,
    combinationsEvaluated: 1 << n,
    feasibleCombinations: feasible,
    overlapAdjustment: standaloneSum - proposed.reduction,
  }
}
