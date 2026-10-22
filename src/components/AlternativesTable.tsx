import React from 'react';
import { Criterion, EvaluatedAlternative, Alternative } from '../types/tradeoff';
import { Table, Plus, Trash2, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  onChangeAlternatives: (next: Alternative[]) => void;
  selectedAlternativeId?: string;
  onSelectAlternative: (id: string) => void;
}

export const AlternativesTable: React.FC<Props> = ({
  criteria,
  alternatives,
  onChangeAlternatives,
  selectedAlternativeId,
  onSelectAlternative,
}) => {
  const handleValueChange = (altId: string, critId: string, val: number) => {
    onChangeAlternatives(
      alternatives.map((a) =>
        a.id === altId
          ? {
              ...a,
              values: {
                ...a.values,
                [critId]: val,
              },
            }
          : a
      )
    );
  };

  const handleUpdateName = (altId: string, name: string, code: string) => {
    onChangeAlternatives(
      alternatives.map((a) => (a.id === altId ? { ...a, name, code } : a))
    );
  };

  const handleAddAlternative = () => {
    const newId = `alt_${Date.now()}`;
    const code = `ALT-${String.fromCharCode(65 + alternatives.length)}`;
    const newValues: Record<string, number> = {};

    // Take median/default from existing
    criteria.forEach((c) => {
      const vals = alternatives.map((a) => a.values[c.id] ?? 0);
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 10;
      newValues[c.id] = Number(avg.toFixed(1));
    });

    const newAlt: Alternative = {
      id: newId,
      name: `候选方案 ${code}`,
      code: code,
      description: '新录入的系统架构候选方案',
      values: newValues,
      color: '#6366f1',
    };

    onChangeAlternatives([...alternatives, newAlt]);
  };

  const handleRemove = (altId: string) => {
    if (alternatives.length <= 2) {
      alert('至少需要保留 2 个方案以开展权衡对比与支配分析。');
      return;
    }
    onChangeAlternatives(alternatives.filter((a) => a.id !== altId));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Table className="w-4 h-4 text-sky-600" />
            系统方案决策矩阵与帕累托非劣解状态表 (Decision Matrix X ∈ ℝᵐˣⁿ)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            输入候选方案在各维度的客观参数，系统将自动核查硬约束边界并计算非支配帕累托集（Pareto Set）
          </p>
        </div>

        <button
          onClick={handleAddAlternative}
          className="flex items-center gap-1 px-3 py-1 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新增候选方案
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
              <th className="py-2.5 px-3 font-semibold w-24">编号</th>
              <th className="py-2.5 px-3 font-semibold w-48">候选方案名称</th>
              <th className="py-2.5 px-3 font-semibold text-center w-24">可行性状态</th>
              <th className="py-2.5 px-3 font-semibold text-center w-28">帕累托前沿</th>
              {criteria.map((c) => (
                <th key={c.id} className="py-2.5 px-3 font-semibold text-right">
                  <div>{c.code}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {c.direction === 'max' ? '↑' : '↓'} {c.unit}
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 font-semibold text-right w-24">支配关系</th>
              <th className="py-2.5 px-2 font-semibold text-center w-10">操作</th>
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
                    isSelected
                      ? 'bg-sky-50/70'
                      : !alt.isFeasible
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : alt.isPareto
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: alt.color || '#64748b' }}
                      />
                      <input
                        type="text"
                        value={alt.code}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateName(alt.id, alt.name, e.target.value)}
                        className="w-16 px-1 py-0.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-sky-500 rounded font-mono text-xs"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={alt.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateName(alt.id, e.target.value, alt.code)}
                      className="w-full px-1.5 py-0.5 bg-transparent border border-transparent hover:border-slate-300 focus:border-sky-500 rounded font-medium text-slate-900 text-xs truncate"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {alt.isFeasible ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> 可行
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded text-[11px]"
                        title={alt.violatedConstraints.map((v) => `${v.criterionName}: ${v.limit}`).join('\n')}
                      >
                        <AlertTriangle className="w-3 h-3" /> 违约
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {alt.isPareto ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded text-[11px]">
                        ★ Rank 1 前沿
                      </span>
                    ) : alt.isFeasible ? (
                      <span className="text-slate-500 text-[11px]">
                        Rank {alt.paretoRank} (被支配)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Criteria values */}
                  {criteria.map((c) => {
                    const rawVal = alt.values[c.id] ?? 0;
                    const isMinViolated = c.constraintMin !== undefined && rawVal < c.constraintMin;
                    const isMaxViolated = c.constraintMax !== undefined && rawVal > c.constraintMax;
                    const isViolated = isMinViolated || isMaxViolated;

                    return (
                      <td key={c.id} className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="any"
                          value={rawVal}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleValueChange(alt.id, c.id, Number(e.target.value))
                          }
                          className={`w-20 px-1.5 py-0.5 text-right font-mono text-xs rounded border transition-colors ${
                            isViolated
                              ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                              : 'border-slate-200 bg-slate-50/50 text-slate-800 focus:bg-white focus:border-sky-500'
                          }`}
                        />
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                    {alt.isPareto ? (
                      <span className="text-emerald-700">支配 {alt.dominates.length} 个方案</span>
                    ) : (
                      <span className="text-slate-400">被 {alt.dominatedBy.length} 个支配</span>
                    )}
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(alt.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="删除方案"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
