import React from 'react';
import { Criterion, OptimizationDirection } from '../types/tradeoff';
import { Sliders, Plus, Trash2, RotateCcw, Sparkles } from 'lucide-react';

interface Props {
  criteria: Criterion[];
  onChangeCriteria: (next: Criterion[]) => void;
  onApplyEntropyWeights: () => void;
}

export const CriteriaTable: React.FC<Props> = ({
  criteria,
  onChangeCriteria,
  onApplyEntropyWeights,
}) => {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.005;

  const handleUpdate = (id: string, updates: Partial<Criterion>) => {
    onChangeCriteria(
      criteria.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleRemove = (id: string) => {
    if (criteria.length <= 2) {
      alert('至少需要保留 2 个评价指标进行多目标权衡分析。');
      return;
    }
    onChangeCriteria(criteria.filter((c) => c.id !== id));
  };

  const handleAdd = () => {
    const newId = `crit_${Date.now()}`;
    const newCrit: Criterion = {
      id: newId,
      name: `新评价指标 ${criteria.length + 1}`,
      code: `C${criteria.length + 1}`,
      unit: '分',
      direction: 'max',
      weight: 0.1,
      description: '用户自定义评价准则',
    };
    onChangeCriteria([...criteria, newCrit]);
  };

  const handleEqualizeWeights = () => {
    const avg = Number((1 / criteria.length).toFixed(4));
    onChangeCriteria(
      criteria.map((c, idx) => ({
        ...c,
        weight: idx === criteria.length - 1 ? 1 - avg * (criteria.length - 1) : avg,
      }))
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            评价准则与工程硬约束配置 (Criteria & Constraints)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            配置优化方向（效益型/成本型）、主观权重及边界极限；违背硬约束的方案将被排除在可行解之外
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleEqualizeWeights}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            权重均分
          </button>
          <button
            onClick={onApplyEntropyWeights}
            className="flex items-center gap-1 px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            熵权法客观赋权
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 px-2.5 py-1 text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            新增指标
          </button>
        </div>
      </div>

      {/* Criteria Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600">
              <th className="py-2.5 px-3 font-semibold">指标标识</th>
              <th className="py-2.5 px-3 font-semibold">准则名称</th>
              <th className="py-2.5 px-3 font-semibold">单位</th>
              <th className="py-2.5 px-3 font-semibold">优化方向</th>
              <th className="py-2.5 px-3 font-semibold w-48">
                权重分配 (
                <span className={isWeightValid ? 'text-emerald-600' : 'text-rose-600 font-bold'}>
                  当前总计: {(totalWeight * 100).toFixed(1)}%
                </span>
                )
              </th>
              <th className="py-2.5 px-3 font-semibold">硬下限约束</th>
              <th className="py-2.5 px-3 font-semibold">硬上限约束</th>
              <th className="py-2.5 px-2 font-semibold text-center w-12">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {criteria.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                  <input
                    type="text"
                    value={c.code}
                    onChange={(e) => handleUpdate(c.id, { code: e.target.value })}
                    className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleUpdate(c.id, { name: e.target.value })}
                    className="w-full px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={c.unit}
                    onChange={(e) => handleUpdate(c.id, { unit: e.target.value })}
                    className="w-14 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-xs"
                  />
                </td>
                <td className="py-2 px-3">
                  <select
                    value={c.direction}
                    onChange={(e) =>
                      handleUpdate(c.id, {
                        direction: e.target.value as OptimizationDirection,
                      })
                    }
                    className={`px-2 py-0.5 rounded border text-xs font-medium ${
                      c.direction === 'max'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    <option value="max">↑ 效益极大化</option>
                    <option value="min">↓ 成本极小化</option>
                  </select>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(c.weight * 100)}
                      onChange={(e) =>
                        handleUpdate(c.id, { weight: Number(e.target.value) / 100 })
                      }
                      className="w-28 accent-sky-600"
                    />
                    <span className="font-mono text-slate-700 text-xs w-10 text-right">
                      {(c.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    placeholder="无下限"
                    value={c.constraintMin ?? ''}
                    onChange={(e) =>
                      handleUpdate(c.id, {
                        constraintMin: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-xs"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    placeholder="无上限"
                    value={c.constraintMax ?? ''}
                    onChange={(e) =>
                      handleUpdate(c.id, {
                        constraintMax: e.target.value === '' ? undefined : Number(e.target.value),
                      })
                    }
                    className="w-20 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-xs"
                  />
                </td>
                <td className="py-2 px-2 text-center">
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title="删除指标"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isWeightValid && (
        <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-md p-2 flex items-center justify-between">
          <span>
            ⚠️ 注意：当前权重总和为 {(totalWeight * 100).toFixed(1)}%，不等于 100%。多属性评价将自动按归一化权重计算。
          </span>
          <button
            onClick={handleEqualizeWeights}
            className="underline hover:text-rose-800 text-xs"
          >
            一键平摊补齐
          </button>
        </div>
      )}
    </div>
  );
};
