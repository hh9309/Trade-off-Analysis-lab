import React from 'react';
import { EvaluatedAlternative, Criterion } from '../types/tradeoff';
import { Award, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';
import { KatexMath } from './KatexMath';

interface Props {
  alternatives: EvaluatedAlternative[];
  criteria: Criterion[];
  selectedAlternativeId?: string;
  onSelectAlternative: (id: string) => void;
  recommendedAlternativeId?: string;
  expertRecommendation?: string;
}

export const TopsisRanking: React.FC<Props> = ({
  alternatives,
  criteria,
  selectedAlternativeId,
  onSelectAlternative,
  recommendedAlternativeId,
  expertRecommendation,
}) => {
  // Sort alternatives by TOPSIS closeness
  const sorted = [...alternatives].sort((a, b) => {
    // feasible first
    if (a.isFeasible && !b.isFeasible) return -1;
    if (!a.isFeasible && b.isFeasible) return 1;
    return b.topsisCloseness - a.topsisCloseness;
  });

  const bestFeasible = sorted.find((a) => a.isFeasible);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            TOPSIS 优劣解距离排序与方案推荐 (Technique for Order Preference by Similarity to Ideal Solution)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            计算候选方案与正理想解 <KatexMath math="D_i^+" /> 及负理想解 <KatexMath math="D_i^-" /> 的几何超空间距离，求解相对贴近度 <KatexMath math="C_i = \frac{D_i^-}{D_i^+ + D_i^-} \in [0, 1]" />
          </p>
        </div>

        {bestFeasible && (
          <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200/60 rounded-md px-3 py-1 text-amber-900">
            <span className="font-semibold">算法最优折中:</span>
            <span>{bestFeasible.name}</span>
            <span className="font-mono font-bold text-amber-700">
              (C={bestFeasible.topsisCloseness.toFixed(3)})
            </span>
          </div>
        )}
      </div>

      {/* Expert Recommendation Callout */}
      {expertRecommendation && (
        <div className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-lg text-xs flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">系统工程总体论证专家权衡建议：</span>
            <span className="text-slate-600 leading-relaxed block mt-0.5">
              {expertRecommendation}
            </span>
          </div>
        </div>
      )}

      {/* Ranked Alternatives List */}
      <div className="space-y-2.5">
        {sorted.map((alt, index) => {
          const isSelected = selectedAlternativeId === alt.id;
          const isBest = bestFeasible?.id === alt.id;
          const isRecommended = recommendedAlternativeId === alt.id;
          const pct = Math.round(alt.topsisCloseness * 100);

          return (
            <div
              key={alt.id}
              onClick={() => onSelectAlternative(alt.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-xs font-bold ${
                      index === 0 && alt.isFeasible
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1 && alt.isFeasible
                        ? 'bg-slate-200 text-slate-700'
                        : index === 2 && alt.isFeasible
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    #{index + 1}
                  </span>

                  <span className="font-semibold text-slate-800 text-sm">{alt.name}</span>
                  <span className="text-xs font-mono text-slate-500">[{alt.code}]</span>

                  {alt.isPareto && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                      ★ 帕累托非劣前沿
                    </span>
                  )}

                  {isRecommended && (
                    <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded px-1.5 py-0.5">
                      推荐基线方案
                    </span>
                  )}

                  {!alt.isFeasible && (
                    <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3" /> 违背硬约束 (不可行)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500 text-[11px]">
                    D⁺(距正理想): <strong>{alt.dPlus.toFixed(3)}</strong>
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    D⁻(距负理想): <strong>{alt.dMinus.toFixed(3)}</strong>
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    C = {alt.topsisCloseness.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    !alt.isFeasible
                      ? 'bg-rose-300'
                      : alt.isPareto
                      ? 'bg-emerald-500'
                      : 'bg-sky-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Infeasible violations explanation if any */}
              {!alt.isFeasible && alt.violatedConstraints.length > 0 && (
                <div className="mt-1.5 text-[11px] text-rose-600">
                  一票否决指标: {alt.violatedConstraints.map((v) => `${v.criterionName} (当前值: ${v.value}, ${v.limit})`).join('; ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
