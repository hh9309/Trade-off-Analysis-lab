export type OptimizationDirection = 'max' | 'min';

export interface Criterion {
  id: string;
  name: string;
  code: string;
  unit: string;
  direction: OptimizationDirection; // 'max': benefit, 'min': cost
  weight: number; // 0 to 1, sum should be 1
  constraintMin?: number; // hard lower bound
  constraintMax?: number; // hard upper bound
  description?: string;
}

export interface Alternative {
  id: string;
  name: string;
  code: string;
  description: string;
  values: Record<string, number>; // criterionId -> raw value
  tags?: string[];
  color?: string;
}

export interface CaseStudy {
  id: string;
  name: string;
  tagline: string;
  category: string;
  background: string;
  tradeoffDilemma: string;
  criteria: Criterion[];
  alternatives: Alternative[];
  expertRecommendation: string;
  recommendedAlternativeId: string;
}

export type NormalizationMethod = 'min-max' | 'vector' | 'linear';

export interface EvaluatedAlternative extends Alternative {
  isFeasible: boolean;
  violatedConstraints: { criterionName: string; value: number; limit: string }[];
  normalizedValues: Record<string, number>; // 0 to 1 (normalized to 'higher is better')
  isPareto: boolean;
  paretoRank: number; // 1 = frontier, 2 = second layer, etc.
  dominatedBy: string[]; // IDs of alternatives dominating this one
  dominates: string[]; // IDs of alternatives this one dominates
  wsmScore: number; // Weighted Sum Model score (0 to 1)
  topsisCloseness: number; // TOPSIS relative closeness (0 to 1)
  topsisRank: number;
  dPlus: number; // Distance to ideal
  dMinus: number; // Distance to anti-ideal
}

export interface ParetoAnalysisResult {
  feasibleAlternatives: EvaluatedAlternative[];
  infeasibleAlternatives: EvaluatedAlternative[];
  paretoAlternatives: EvaluatedAlternative[];
  allAlternatives: EvaluatedAlternative[];
  idealPoint: Record<string, number>;
  antiIdealPoint: Record<string, number>;
}
