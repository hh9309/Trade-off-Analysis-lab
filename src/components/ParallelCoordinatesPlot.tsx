import React, { useState } from 'react';
import { Criterion, EvaluatedAlternative } from '../types/tradeoff';
import { GitCommit, Filter } from 'lucide-react';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  selectedAlternativeId?: string;
  onSelectAlternative: (id: string) => void;
}

export const ParallelCoordinatesPlot: React.FC<Props> = ({
  criteria,
  alternatives,
  selectedAlternativeId,
  onSelectAlternative,
}) => {
  const [hoveredAltId, setHoveredAltId] = useState<string | null>(null);

  const width = 800;
  const height = 360;
  const margin = { top: 40, right: 50, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const n = criteria.length;
  const stepX = innerWidth / (n - 1 || 1);

  // Min and max for each criterion axis
  const bounds = React.useMemo(() => {
    const res: Record<string, { min: number; max: number }> = {};
    criteria.forEach((c) => {
      const vals = alternatives.map((a) => a.values[c.id] ?? 0);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      res[c.id] = { min, max: max === min ? min + 1 : max };
    });
    return res;
  }, [criteria, alternatives]);

  // Map value to Y coordinate (best at top: Y=margin.top, worst at bottom)
  const getY = (criterionId: string, val: number) => {
    const c = criteria.find((item) => item.id === criterionId);
    if (!c) return margin.top + innerHeight / 2;
    const { min, max } = bounds[criterionId];
    let ratio = (val - min) / (max - min || 1);

    // If direction is min (cost type), lower value should be placed at the TOP (higher desirability)!
    if (c.direction === 'min') {
      ratio = 1 - ratio;
    }

    // Top is y=margin.top (ratio = 1)
    return margin.top + (1 - ratio) * innerHeight;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-indigo-600" />
            多维并行坐标分析图 (Parallel Coordinates Plot)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            各轴顶部均为“更优方向”（效益型取大置顶，成本型取小置顶）；折线斜率直观呈现属性冲突与权衡代价
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
            帕累托前沿折线
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-slate-300 inline-block"></span>
            普通可行解
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-rose-400 inline-block stroke-dasharray"></span>
            违约方案
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto pt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[640px]">
          {/* Vertical Axes */}
          {criteria.map((c, i) => {
            const x = margin.left + i * stepX;
            const { min, max } = bounds[c.id];
            const topVal = c.direction === 'min' ? min : max;
            const bottomVal = c.direction === 'min' ? max : min;

            return (
              <g key={c.id}>
                {/* Axis line */}
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />

                {/* Top Arrow representing optimal direction */}
                <polygon
                  points={`${x},${margin.top - 6} ${x - 4},${margin.top} ${x + 4},${margin.top}`}
                  fill="#0284c7"
                />

                {/* Top tick label */}
                <text
                  x={x}
                  y={margin.top - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#0284c7"
                  fontWeight="600"
                >
                  {topVal.toFixed(1)} {c.unit}
                </text>

                {/* Bottom tick label */}
                <text
                  x={x}
                  y={height - margin.bottom + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#94a3b8"
                >
                  {bottomVal.toFixed(1)} {c.unit}
                </text>

                {/* Axis Name */}
                <text
                  x={x}
                  y={height - margin.bottom + 32}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#334155"
                >
                  {c.code || c.name.slice(0, 5)}
                </text>
                <text
                  x={x}
                  y={height - 2}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {c.direction === 'max' ? '↑越大越优' : '↓越小越优'}
                </text>
              </g>
            );
          })}

          {/* Polylines for each alternative */}
          {alternatives.map((alt) => {
            const isHovered = hoveredAltId === alt.id;
            const isSelected = selectedAlternativeId === alt.id;
            const isTarget = isHovered || isSelected;

            const points = criteria
              .map((c, i) => {
                const x = margin.left + i * stepX;
                const y = getY(c.id, alt.values[c.id] ?? 0);
                return `${x},${y}`;
              })
              .join(' ');

            let strokeColor = alt.isPareto ? '#10b981' : '#94a3b8';
            let strokeWidth = alt.isPareto ? 2.5 : 1.5;
            let opacity = 0.55;

            if (!alt.isFeasible) {
              strokeColor = '#f43f5e';
              strokeWidth = 1.8;
            }

            if (isTarget) {
              strokeColor = alt.isPareto ? '#059669' : '#0284c7';
              strokeWidth = 4;
              opacity = 1.0;
            } else if (hoveredAltId || selectedAlternativeId) {
              opacity = 0.15;
            }

            return (
              <g
                key={alt.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAltId(alt.id)}
                onMouseLeave={() => setHoveredAltId(null)}
                onClick={() => onSelectAlternative(alt.id)}
              >
                <polyline
                  points={points}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={alt.isFeasible ? 'none' : '4 3'}
                  opacity={opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Vertices on each axis */}
                {criteria.map((c, i) => {
                  const x = margin.left + i * stepX;
                  const y = getY(c.id, alt.values[c.id] ?? 0);
                  return (
                    <circle
                      key={c.id}
                      cx={x}
                      cy={y}
                      r={isTarget ? 5 : 3}
                      fill={strokeColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      opacity={opacity}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Hover/Active Alternative Callout */}
        {(hoveredAltId || selectedAlternativeId) && (
          <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            {(() => {
              const current = alternatives.find(
                (a) => a.id === (hoveredAltId || selectedAlternativeId)
              );
              if (!current) return null;
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: current.color || '#0284c7' }}
                    />
                    <span className="font-bold text-slate-800">{current.name}</span>
                    <span className="text-slate-500">[{current.code}]</span>
                    {current.isPareto ? (
                      <span className="text-emerald-700 font-semibold">★ 帕累托最优</span>
                    ) : (
                      <span className="text-slate-500">被支配</span>
                    )}
                    {!current.isFeasible && (
                      <span className="text-rose-600 font-semibold">
                        违背约束: {current.violatedConstraints.map((v) => v.criterionName).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px] text-slate-700">
                    {criteria.map((c) => (
                      <span key={c.id}>
                        {c.code}:{' '}
                        <strong className="text-slate-900">{current.values[c.id]}</strong>{' '}
                        {c.unit}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
