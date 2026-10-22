import React from 'react';
import { Criterion, EvaluatedAlternative, NormalizationMethod } from '../types/tradeoff';
import { Binary, HelpCircle, Check, Percent } from 'lucide-react';
import { KatexMath } from './KatexMath';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  normMethod: NormalizationMethod;
  onChangeNormMethod: (method: NormalizationMethod) => void;
  selectedAlternativeId?: string;
  onSelectAlternative: (id: string) => void;
}

export const NormalizationView: React.FC<Props> = ({
  criteria,
  alternatives,
  normMethod,
  onChangeNormMethod,
  selectedAlternativeId,
  onSelectAlternative,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      {/* Header and Method Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Binary className="w-4 h-4 text-teal-600" />
            多维异构属性无量纲化映射与热力阵 (Matrix Normalization R ∈ [0, 1]ᵐˣⁿ)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            统一消除推力(吨)、成本(万元)、时延(ms)等不同物理量纲差异，统一映射为效益型标量 [0, 1]
          </p>
        </div>

        {/* Normalization Method Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => onChangeNormMethod('min-max')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              normMethod === 'min-max'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            极差法 (Min-Max)
          </button>
          <button
            onClick={() => onChangeNormMethod('vector')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              normMethod === 'vector'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            向量范数法 (Vector)
          </button>
          <button
            onClick={() => onChangeNormMethod('linear')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              normMethod === 'linear'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            线性比例法 (Linear)
          </button>
        </div>
      </div>

      {/* Mathematical Principle Box with KaTeX */}
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {normMethod === 'min-max' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-900">极差无量纲化算子：</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="text-[11px] text-emerald-800 font-semibold">效益型:</span>
                <KatexMath math="r_{ij} = \frac{x_{ij} - \min_k x_{kj}}{\max_k x_{kj} - \min_k x_{kj}}" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="text-[11px] text-indigo-800 font-semibold">成本型:</span>
                <KatexMath math="r_{ij} = \frac{\max_k x_{kj} - x_{ij}}{\max_k x_{kj} - \min_k x_{kj}}" />
              </div>
            </div>
          )}
          {normMethod === 'vector' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-900">欧氏超球向量范数算子：</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <KatexMath math="r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^m x_{kj}^2}}" />
              </div>
              <span className="text-[11px] text-slate-500">保持超空间投影几何各向同性</span>
            </div>
          )}
          {normMethod === 'linear' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-900">线性极值比例算子：</span>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="text-[11px] text-emerald-800 font-semibold">效益型:</span>
                <KatexMath math="r_{ij} = \frac{x_{ij}}{\max_k x_{kj}}" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <span className="text-[11px] text-indigo-800 font-semibold">成本型:</span>
                <KatexMath math="r_{ij} = \frac{\min_k x_{kj}}{x_{ij}}" />
              </div>
            </div>
          )}
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          矩阵映射范围: <KatexMath math="R \in [0, 1]^{m \times n}" />
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
              <th className="py-2.5 px-3 font-semibold w-24">编号</th>
              <th className="py-2.5 px-3 font-semibold w-44">候选方案</th>
              {criteria.map((c) => (
                <th key={c.id} className="py-2.5 px-3 font-semibold text-right">
                  <div>{c.code}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    w={(c.weight * 100).toFixed(0)}%
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 font-semibold text-right w-28 text-emerald-800">
                WSM 加权总分
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alternatives.map((alt) => {
              const isSelected = selectedAlternativeId === alt.id;

              return (
                <tr
                  key={alt.id}
                  onClick={() => onSelectAlternative(alt.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-sky-50' : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    {alt.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 truncate">
                    {alt.name}
                  </td>

                  {/* Normalized Values with Heatmap Background */}
                  {criteria.map((c) => {
                    const normVal = alt.normalizedValues[c.id] ?? 0;
                    // Color intensity from 0 to 1
                    const alpha = Math.max(0.04, Math.min(0.4, normVal * 0.45));
                    const isBest = normVal >= 0.999;

                    return (
                      <td
                        key={c.id}
                        className="py-2.5 px-3 text-right font-mono text-xs"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${alpha})`,
                        }}
                      >
                        <span className={`tabular-nums ${isBest ? 'font-bold text-emerald-900' : 'text-slate-800'}`}>
                          {normVal.toFixed(3)}
                        </span>
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/40">
                    <span className="text-sm">{(alt.wsmScore * 100).toFixed(1)}</span>
                    <span className="text-[10px] text-emerald-600 font-normal ml-0.5">分</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
