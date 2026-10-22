import React, { useState } from 'react';
import { Criterion, EvaluatedAlternative } from '../types/tradeoff';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  selectedAlternativeId?: string;
  onSelectAlternative: (id: string) => void;
}

export const RadarChart: React.FC<Props> = ({
  criteria,
  alternatives,
  selectedAlternativeId,
  onSelectAlternative,
}) => {
  // Toggle visibility of each alternative
  const [visibleAltIds, setVisibleAltIds] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    alternatives.forEach((a, i) => {
      // By default show Pareto alternatives or first 3
      init[a.id] = a.isPareto || i < 3;
    });
    return init;
  });

  const toggleVisibility = (id: string) => {
    setVisibleAltIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    alternatives.forEach((a) => (next[a.id] = true));
    setVisibleAltIds(next);
  };

  const selectOnlyPareto = () => {
    const next: Record<string, boolean> = {};
    alternatives.forEach((a) => (next[a.id] = a.isPareto));
    setVisibleAltIds(next);
  };

  const size = 420;
  const center = size / 2;
  const radius = size * 0.36;
  const n = criteria.length;

  if (n < 3) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        雷达图至少需要 3 个评价指标才能构建闭合多边形。
      </div>
    );
  }

  // Calculate polygon points for each criterion axis angle
  // 0 radians at top (-PI/2)
  const angleStep = (2 * Math.PI) / n;
  const getCoordinates = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius * Math.max(0, Math.min(1, value));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const levels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            多属性综合效能雷达图 (Multi-Attribute Spider Chart)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            外圈 100% 代表当前所有方案在该维度达到的理论最优值（效益型极大，成本型极小）
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={selectOnlyPareto}
            className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            仅看帕累托前沿
          </button>
          <button
            onClick={selectAll}
            className="px-2.5 py-1 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            全显方案
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2">
        {/* Radar SVG */}
        <div className="lg:col-span-8 flex justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[420px] h-auto">
            {/* Concentric Polygons */}
            {levels.map((level) => {
              const points = criteria
                .map((_, i) => {
                  const pt = getCoordinates(i, level);
                  return `${pt.x},${pt.y}`;
                })
                .join(' ');

              return (
                <g key={level}>
                  <polygon
                    points={points}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={level === 1 ? '1.5' : '1'}
                    strokeDasharray={level === 1 ? 'none' : '3 3'}
                  />
                  <text
                    x={center + 6}
                    y={center - radius * level - 2}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {(level * 100).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Axis Spokes and Labels */}
            {criteria.map((c, i) => {
              const outerPt = getCoordinates(i, 1.0);
              const labelPt = getCoordinates(i, 1.18);
              const isRight = labelPt.x > center + 10;
              const isLeft = labelPt.x < center - 10;
              const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

              return (
                <g key={c.id}>
                  <line
                    x1={center}
                    y1={center}
                    x2={outerPt.x}
                    y2={outerPt.y}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={labelPt.x}
                    y={labelPt.y}
                    textAnchor={textAnchor}
                    fontSize="11"
                    fontWeight="500"
                    fill="#334155"
                    className="select-none"
                  >
                    {c.code || c.name.slice(0, 5)}
                    <tspan
                      x={labelPt.x}
                      dy="12"
                      textAnchor={textAnchor}
                      fontSize="9"
                      fill="#64748b"
                      fontFamily="monospace"
                    >
                      {c.direction === 'max' ? '↑极优' : '↓极省'} ({(c.weight * 100).toFixed(0)}%)
                    </tspan>
                  </text>
                </g>
              );
            })}

            {/* Alternative Polygons */}
            {alternatives.map((alt) => {
              if (!visibleAltIds[alt.id]) return null;

              const isSelected = selectedAlternativeId === alt.id;
              const points = criteria
                .map((c, i) => {
                  const val = alt.normalizedValues[c.id] ?? 0;
                  const pt = getCoordinates(i, val);
                  return `${pt.x},${pt.y}`;
                })
                .join(' ');

              const strokeColor = alt.isPareto ? alt.color || '#0284c7' : '#94a3b8';
              const fillColor = alt.isPareto ? alt.color || '#0284c7' : '#94a3b8';

              return (
                <g
                  key={alt.id}
                  className="cursor-pointer transition-opacity"
                  onClick={() => onSelectAlternative(alt.id)}
                >
                  <polygon
                    points={points}
                    fill={fillColor}
                    fillOpacity={isSelected ? 0.35 : alt.isPareto ? 0.2 : 0.08}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : alt.isPareto ? 2 : 1.2}
                    strokeDasharray={alt.isFeasible ? 'none' : '4 3'}
                  />

                  {/* Vertices */}
                  {criteria.map((c, i) => {
                    const val = alt.normalizedValues[c.id] ?? 0;
                    const pt = getCoordinates(i, val);
                    return (
                      <circle
                        key={c.id}
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 4.5 : 3}
                        fill={strokeColor}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Alternatives Toggle List */}
        <div className="lg:col-span-4 flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          <span className="text-xs font-semibold text-slate-700 pb-1 border-b border-slate-100">
            方案图层控制与对比切换
          </span>
          {alternatives.map((alt) => {
            const isVisible = visibleAltIds[alt.id];
            const isSelected = selectedAlternativeId === alt.id;

            return (
              <div
                key={alt.id}
                onClick={() => onSelectAlternative(alt.id)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(alt.id);
                    }}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    {isVisible ? (
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>

                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: alt.color || '#64748b' }}
                  />

                  <div className="truncate">
                    <span className="font-semibold text-slate-800">{alt.code}</span>
                    <span className="text-slate-500 text-[11px] block truncate">{alt.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                  {alt.isPareto && (
                    <span className="text-emerald-700 font-medium">★ Pareto</span>
                  )}
                  {!alt.isFeasible && (
                    <span className="text-rose-600 font-medium">违约</span>
                  )}
                  <span className="font-mono text-slate-500">
                    {(alt.wsmScore * 100).toFixed(0)}分
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
