import {
  Alternative,
  Criterion,
  EvaluatedAlternative,
  NormalizationMethod,
  ParetoAnalysisResult,
} from '../types/tradeoff';

/**
 * Check if an alternative satisfies all hard constraints
 */
export function checkFeasibility(
  alt: Alternative,
  criteria: Criterion[]
): { isFeasible: boolean; violations: { criterionName: string; value: number; limit: string }[] } {
  const violations: { criterionName: string; value: number; limit: string }[] = [];

  for (const c of criteria) {
    const val = alt.values[c.id];
    if (val === undefined || val === null) continue;

    if (c.constraintMin !== undefined && val < c.constraintMin) {
      violations.push({
        criterionName: c.name,
        value: val,
        limit: `低于硬下限 ${c.constraintMin} ${c.unit}`,
      });
    }

    if (c.constraintMax !== undefined && val > c.constraintMax) {
      violations.push({
        criterionName: c.name,
        value: val,
        limit: `超出硬上限 ${c.constraintMax} ${c.unit}`,
      });
    }
  }

  return {
    isFeasible: violations.length === 0,
    violations,
  };
}

/**
 * Normalize criteria values across all alternatives to [0, 1] range (higher is always better)
 */
export function normalizeMatrix(
  alternatives: Alternative[],
  criteria: Criterion[],
  method: NormalizationMethod = 'min-max'
): Record<string, Record<string, number>> {
  const normalized: Record<string, Record<string, number>> = {};
  alternatives.forEach((a) => (normalized[a.id] = {}));

  for (const c of criteria) {
    const rawValues = alternatives.map((a) => a.values[c.id] ?? 0);
    const minVal = Math.min(...rawValues);
    const maxVal = Math.max(...rawValues);
    const diff = maxVal - minVal;

    // Vector Norm: sqrt(sum(x^2))
    const vectorNorm = Math.sqrt(rawValues.reduce((sum, v) => sum + v * v, 0)) || 1;

    for (const a of alternatives) {
      const v = a.values[c.id] ?? 0;
      let normVal = 0.5;

      if (method === 'min-max') {
        if (diff === 0) {
          normVal = 1.0;
        } else if (c.direction === 'max') {
          normVal = (v - minVal) / diff;
        } else {
          normVal = (maxVal - v) / diff;
        }
      } else if (method === 'vector') {
        const vNorm = v / vectorNorm;
        if (c.direction === 'max') {
          normVal = vNorm;
        } else {
          // invert for cost
          normVal = Math.max(0, 1 - vNorm);
        }
      } else if (method === 'linear') {
        if (c.direction === 'max') {
          normVal = maxVal > 0 ? v / maxVal : 0;
        } else {
          normVal = v > 0 ? minVal / v : 0;
        }
      }

      // Clamp between 0 and 1
      normalized[a.id][c.id] = Math.max(0, Math.min(1, normVal));
    }
  }

  return normalized;
}

/**
 * Determines whether Alternative A dominates Alternative B
 * In engineering trade study: A dominates B iff for all criteria A is no worse than B,
 * and for at least one criterion A is strictly better than B.
 */
export function dominates(
  a: Alternative,
  b: Alternative,
  criteria: Criterion[]
): boolean {
  let strictlyBetterInAtLeastOne = false;

  for (const c of criteria) {
    const valA = a.values[c.id] ?? 0;
    const valB = b.values[c.id] ?? 0;

    if (c.direction === 'max') {
      if (valA < valB) return false;
      if (valA > valB) strictlyBetterInAtLeastOne = true;
    } else {
      // Cost criterion: lower is better
      if (valA > valB) return false;
      if (valA < valB) strictlyBetterInAtLeastOne = true;
    }
  }

  return strictlyBetterInAtLeastOne;
}

/**
 * Fast Non-Dominated Sorting for Pareto Frontier and Pareto Ranks (Rank 1 = frontier)
 */
export function calculateParetoRanks(
  feasibleAlts: Alternative[],
  criteria: Criterion[]
): {
  ranks: Record<string, number>;
  dominatedByMap: Record<string, string[]>;
  dominatesMap: Record<string, string[]>;
} {
  const dominatesMap: Record<string, string[]> = {};
  const dominatedByMap: Record<string, string[]> = {};
  const dominationCount: Record<string, number> = {};
  const ranks: Record<string, number> = {};

  feasibleAlts.forEach((a) => {
    dominatesMap[a.id] = [];
    dominatedByMap[a.id] = [];
    dominationCount[a.id] = 0;
  });

  // Pairwise comparisons
  for (let i = 0; i < feasibleAlts.length; i++) {
    const p = feasibleAlts[i];
    for (let j = 0; j < feasibleAlts.length; j++) {
      if (i === j) continue;
      const q = feasibleAlts[j];
      if (dominates(p, q, criteria)) {
        dominatesMap[p.id].push(q.id);
      } else if (dominates(q, p, criteria)) {
        dominatedByMap[p.id].push(q.id);
        dominationCount[p.id]++;
      }
    }
  }

  let currentRank = 1;
  let currentFront = feasibleAlts.filter((a) => dominationCount[a.id] === 0).map((a) => a.id);

  while (currentFront.length > 0) {
    const nextFront: string[] = [];
    for (const pId of currentFront) {
      ranks[pId] = currentRank;
      for (const qId of dominatesMap[pId]) {
        dominationCount[qId]--;
        if (dominationCount[qId] === 0) {
          nextFront.push(qId);
        }
      }
    }
    currentRank++;
    currentFront = nextFront;
  }

  // Fallback for any unassigned
  feasibleAlts.forEach((a) => {
    if (!ranks[a.id]) ranks[a.id] = currentRank;
  });

  return { ranks, dominatedByMap, dominatesMap };
}

/**
 * Comprehensive Evaluation: Feasibility + Normalization + Pareto + TOPSIS + WSM
 */
export function evaluateAlternatives(
  alternatives: Alternative[],
  criteria: Criterion[],
  normMethod: NormalizationMethod = 'min-max'
): ParetoAnalysisResult {
  // 1. Feasibility check
  const evaluatedTemp = alternatives.map((alt) => {
    const { isFeasible, violations } = checkFeasibility(alt, criteria);
    return {
      ...alt,
      isFeasible,
      violatedConstraints: violations,
    };
  });

  const feasibleList = evaluatedTemp.filter((a) => a.isFeasible);
  const infeasibleList = evaluatedTemp.filter((a) => !a.isFeasible);

  // 2. Normalization (using all alternatives for global reference scale)
  const normValues = normalizeMatrix(alternatives, criteria, normMethod);

  // 3. Pareto calculation (on feasible alternatives)
  const { ranks, dominatedByMap, dominatesMap } = calculateParetoRanks(feasibleList, criteria);

  // 4. TOPSIS & WSM calculation
  // Total weight normalization check
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0) || 1;
  const weights = criteria.map((c) => c.weight / totalWeight);

  // Ideal (A+) and Anti-ideal (A-) points in normalized weighted space
  const idealWeighted: number[] = [];
  const antiIdealWeighted: number[] = [];

  criteria.forEach((_, cIdx) => {
    const w = weights[cIdx];
    // In our normalized matrix, 1.0 is already the best direction for every criterion!
    idealWeighted[cIdx] = 1.0 * w;
    antiIdealWeighted[cIdx] = 0.0 * w;
  });

  // Ideal point in original criteria coordinates
  const idealPoint: Record<string, number> = {};
  const antiIdealPoint: Record<string, number> = {};

  criteria.forEach((c) => {
    const vals = alternatives.map((a) => a.values[c.id] ?? 0);
    if (c.direction === 'max') {
      idealPoint[c.id] = Math.max(...vals);
      antiIdealPoint[c.id] = Math.min(...vals);
    } else {
      idealPoint[c.id] = Math.min(...vals);
      antiIdealPoint[c.id] = Math.max(...vals);
    }
  });

  // Calculate TOPSIS closeness and WSM scores for each
  const fullyEvaluated: EvaluatedAlternative[] = evaluatedTemp.map((alt) => {
    const nVals = normValues[alt.id];

    // WSM Score
    let wsmScore = 0;
    criteria.forEach((c, idx) => {
      wsmScore += (nVals[c.id] ?? 0) * weights[idx];
    });

    // TOPSIS Euclidean Distances
    let dPlusSq = 0;
    let dMinusSq = 0;

    criteria.forEach((c, idx) => {
      const weightedVal = (nVals[c.id] ?? 0) * weights[idx];
      dPlusSq += Math.pow(weightedVal - idealWeighted[idx], 2);
      dMinusSq += Math.pow(weightedVal - antiIdealWeighted[idx], 2);
    });

    const dPlus = Math.sqrt(dPlusSq);
    const dMinus = Math.sqrt(dMinusSq);
    const topsisCloseness = dPlus + dMinus > 0 ? dMinus / (dPlus + dMinus) : 0;

    const isFeasible = alt.isFeasible;
    const isPareto = isFeasible && ranks[alt.id] === 1;

    return {
      ...alt,
      normalizedValues: nVals,
      isPareto,
      paretoRank: isFeasible ? (ranks[alt.id] ?? 99) : 999,
      dominatedBy: dominatedByMap[alt.id] ?? [],
      dominates: dominatesMap[alt.id] ?? [],
      wsmScore,
      topsisCloseness,
      topsisRank: 0, // will assign next
      dPlus,
      dMinus,
    };
  });

  // Assign TOPSIS ranks (feasible ones ranked first)
  const sortedFeasible = [...fullyEvaluated.filter((a) => a.isFeasible)].sort(
    (a, b) => b.topsisCloseness - a.topsisCloseness
  );
  sortedFeasible.forEach((a, idx) => {
    a.topsisRank = idx + 1;
  });

  const sortedInfeasible = [...fullyEvaluated.filter((a) => !a.isFeasible)].sort(
    (a, b) => b.topsisCloseness - a.topsisCloseness
  );
  sortedInfeasible.forEach((a, idx) => {
    a.topsisRank = sortedFeasible.length + idx + 1;
  });

  const allMap = new Map<string, EvaluatedAlternative>();
  [...sortedFeasible, ...sortedInfeasible].forEach((a) => allMap.set(a.id, a));
  const finalAll = alternatives.map((a) => allMap.get(a.id)!);

  return {
    feasibleAlternatives: finalAll.filter((a) => a.isFeasible),
    infeasibleAlternatives: finalAll.filter((a) => !a.isFeasible),
    paretoAlternatives: finalAll.filter((a) => a.isPareto),
    allAlternatives: finalAll,
    idealPoint,
    antiIdealPoint,
  };
}

/**
 * Entropy Weight Method (Shannon Entropy) - Calculates objective weights based on data variance
 */
export function calculateEntropyWeights(
  alternatives: Alternative[],
  criteria: Criterion[]
): Record<string, number> {
  const m = alternatives.length;
  if (m <= 1) {
    const uniform = 1 / criteria.length;
    const res: Record<string, number> = {};
    criteria.forEach((c) => (res[c.id] = uniform));
    return res;
  }

  const normMatrix = normalizeMatrix(alternatives, criteria, 'min-max');
  const entropies: Record<string, number> = {};
  const k = 1 / Math.log(m);

  for (const c of criteria) {
    const sumNorm = alternatives.reduce((sum, a) => sum + (normMatrix[a.id][c.id] || 0.0001), 0);
    let entropySum = 0;

    for (const a of alternatives) {
      const p = (normMatrix[a.id][c.id] || 0.0001) / sumNorm;
      if (p > 0) {
        entropySum += p * Math.log(p);
      }
    }

    const e = -k * entropySum;
    entropies[c.id] = Math.max(0, 1 - e); // Information divergence d_j = 1 - e_j
  }

  const totalDivergence = Object.values(entropies).reduce((sum, v) => sum + v, 0) || 1;
  const weights: Record<string, number> = {};

  criteria.forEach((c) => {
    weights[c.id] = Number((entropies[c.id] / totalDivergence).toFixed(4));
  });

  return weights;
}
