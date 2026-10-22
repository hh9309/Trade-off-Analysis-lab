import React, { useState } from 'react';
import { Criterion, EvaluatedAlternative, Alternative } from '../types/tradeoff';
import { Sliders, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { KatexMath } from './KatexMath';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  onChangeCriteria: (next: Criterion[]) => void;
}

export const ConstraintsModule: React.FC<Props> = ({
  criteria,
  alternatives,
  onChangeCriteria,
}) => {
  const [relaxationPct, setRelaxationPct] = useState<number>(0);

  const feasibleList = alternatives.filter((a) => a.isFeasible);
  const infeasibleList = alternatives.filter((a) => !a.isFeasible);
  const total = alternatives.length;
  const feasibleRate = total > 0 ? Math.round((feasibleList.length / total) * 100) : 0;

  // Handle relaxing constraints
  const handleRelaxConstraints = (pct: number) => {
    setRelaxationPct(pct);
    const factor = pct / 100;

    const nextCriteria = criteria.map((c) => {
      let nextMin = c.constraintMin;
      let nextMax = c.constraintMax;

      if (c.constraintMin !== undefined) {
        // relaxing lower bound means lowering it
        nextMin = Number((c.constraintMin * (1 - factor)).toFixed(2));
      }
      if (c.constraintMax !== undefined) {
        // relaxing upper bound means raising it
        nextMax = Number((c.constraintMax * (1 + factor)).toFixed(2));
      }

      return {
        ...c,
        constraintMin: nextMin,
        constraintMax: nextMax,
      };
    });

    onChangeCriteria(nextCriteria);
  };

  const handleResetLimits = () => {
    setRelaxationPct(0);
    // Remove all constraints or reset
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-5">
      {/* Module Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              模块 03
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              多目标优化与工程约束条件设置 (Multi-Objective Optimization & Hard Constraints)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            区分软目标极性与硬极限约束 <KatexMath math="x_j^{\min} \le x_{ij} \le x_j^{\max}" />；映射可行域解空间 <KatexMath math="\mathcal{F} \subset \mathcal{A}" />，防止违规劣解污染帕累托前沿
          </p>
        </div>

        {/* Feasibility KPI strip */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">总方案:</span>
            <span className="font-bold text-slate-800">{total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">可行解:</span>
            <span className="font-bold text-emerald-600">{feasibleList.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-slate-500">违约解:</span>
            <span className="font-bold text-rose-600">{infeasibleList.length}</span>
          </div>
          <div className="text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded">
            合规率 {feasibleRate}%
          </div>
        </div>
      </div>

      {/* Constraints Sensitivity & Relaxation Simulator */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-semibold text-slate-800">
              工程硬约束边界放宽敏感度推演 (Constraint Relaxation Sensitivity)
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            当前放宽冗余度: <strong>+{relaxationPct}%</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={relaxationPct}
            onChange={(e) => handleRelaxConstraints(Number(e.target.value))}
            className="flex-1 accent-sky-600"
          />
          <div className="flex items-center gap-1 text-xs">
            {[0, 10, 20, 30].map((step) => (
              <button
                key={step}
                onClick={() => handleRelaxConstraints(step)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  relaxationPct === step
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                +{step}%
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>工程实践启示：</strong> 当型号硬约束设定过严时，大量高潜能突破性方案会被提前否决。通过阶梯式放宽（如放宽 10% 成本或功耗），可动态观测是否有更优的帕累托前沿候选被激活。
        </p>
      </div>

      {/* Constraints List & Current Violation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Active Hard Constraints */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="font-semibold text-xs text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>各维度工程硬极限约束设定表</span>
            <span className="text-[11px] text-slate-400 font-normal">共 {criteria.length} 个评价属性</span>
          </div>

          <div className="space-y-2 text-xs">
            {criteria.map((c) => {
              const hasConstraint = c.constraintMin !== undefined || c.constraintMax !== undefined;

              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-1.5">[{c.code}]</span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      优化目标: {c.direction === 'max' ? '↑ 极大化(效益)' : '↓ 极小化(成本)'} · 权重: {(c.weight * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-right font-mono text-xs">
                    {hasConstraint ? (
                      <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-medium">
                        {c.constraintMin !== undefined && `≥ ${c.constraintMin} `}
                        {c.constraintMax !== undefined && `≤ ${c.constraintMax} `}
                        {c.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400">无刚性边界</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Feasibility Status & Infeasible Root Cause */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div className="font-semibold text-xs text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>方案可行性审核与一票否决指标溯源</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {infeasibleList.length > 0 ? `检出 ${infeasibleList.length} 个违规方案` : '所有方案均满足约束'}
            </span>
          </div>

          <div className="space-y-2 text-xs max-h-[380px] overflow-y-auto">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className={`p-2.5 rounded-lg border text-xs ${
                  alt.isFeasible
                    ? 'border-emerald-200 bg-emerald-50/30 text-slate-800'
                    : 'border-rose-200 bg-rose-50/40 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    {alt.isFeasible ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span>{alt.code} · {alt.name}</span>
                  </div>
                  <span
                    className={`font-semibold text-[11px] ${
                      alt.isFeasible ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {alt.isFeasible ? '完全满足硬约束' : '触发一票否决'}
                  </span>
                </div>

                {!alt.isFeasible && (
                  <div className="mt-1.5 pl-5 space-y-1 text-[11px] text-rose-700 font-mono">
                    {alt.violatedConstraints.map((v, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span>• {v.criterionName}: 当前值 {v.value}</span>
                        <span className="font-semibold">({v.limit})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
