import React, { useState, useMemo } from 'react';
import { Criterion, EvaluatedAlternative } from '../types/tradeoff';
import { Sparkles, AlertTriangle, Crosshair, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  selectedAlternativeId?: string;
  onSelectAlternative: (id: string) => void;
}

export const ParetoScatterPlot: React.FC<Props> = ({
  criteria,
  alternatives,
  selectedAlternativeId,
  onSelectAlternative,
}) => {
  // Select which two criteria to plot on X and Y
  const [xAxisId, setXAxisId] = useState<string>(criteria[0]?.id || '');
  const [yAxisId, setYAxisId] = useState<string>(criteria[1]?.id || criteria[0]?.id || '');
  const [hoveredAlt, setHoveredAlt] = useState<EvaluatedAlternative | null>(null);

  // Sync if criteria change
  React.useEffect(() => {
    if (!criteria.find((c) => c.id === xAxisId) && criteria[0]) {
      setXAxisId(criteria[0].id);
    }
    if (!criteria.find((c) => c.id === yAxisId) && criteria[1]) {
      setYAxisId(criteria[1].id);
    }
  }, [criteria, xAxisId, yAxisId]);

  const xCriterion = criteria.find((c) => c.id === xAxisId) || criteria[0];
  const yCriterion = criteria.find((c) => c.id === yAxisId) || criteria[1] || criteria[0];

  // Canvas bounds & margins
  const width = 640;
  const height = 400;
  const margin = { top: 30, right: 40, bottom: 50, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Min and max values for axes
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const xVals = alternatives.map((a) => a.values[xCriterion.id] ?? 0);
    const yVals = alternatives.map((a) => a.values[yCriterion.id] ?? 0);

    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const xPad = (maxX - minX) * 0.12 || 1;
    const yPad = (maxY - minY) * 0.12 || 1;

    return {
      xMin: Math.max(0, minX - xPad),
      xMax: maxX + xPad,
      yMin: Math.max(0, minY - yPad),
      yMax: maxY + yPad,
    };
  }, [alternatives, xCriterion, yCriterion]);

  // Map to SVG coordinates
  const scaleX = (val: number) => {
    const ratio = (val - xMin) / (xMax - xMin || 1);
    return margin.left + ratio * innerWidth;
  };

  const scaleY = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin || 1);
    // SVG y goes down
    return margin.top + (1 - ratio) * innerHeight;
  };

  // Compute 2D specific Pareto front for these two chosen axes
  const twoDimPareto = useMemo(() => {
    const feasible = alternatives.filter((a) => a.isFeasible);
    const frontier: EvaluatedAlternative[] = [];

    for (const a of feasible) {
      const aX = a.values[xCriterion.id] ?? 0;
      const aY = a.values[yCriterion.id] ?? 0;
      let dominated = false;

      for (const b of feasible) {
        if (a.id === b.id) continue;
        const bX = b.values[xCriterion.id] ?? 0;
        const bY = b.values[yCriterion.id] ?? 0;

        const bBetterOrEqualX = xCriterion.direction === 'max' ? bX >= aX : bX <= aX;
        const bBetterOrEqualY = yCriterion.direction === 'max' ? bY >= aY : bY <= aY;
        const bStrictlyBetter =
          (xCriterion.direction === 'max' ? bX > aX : bX < aX) ||
          (yCriterion.direction === 'max' ? bY > aY : bY < aY);

        if (bBetterOrEqualX && bBetterOrEqualY && bStrictlyBetter) {
          dominated = true;
          break;
        }
      }

      if (!dominated) {
        frontier.push(a);
      }
    }

    // Sort along X-axis for drawing a smooth step line or boundary
    return frontier.sort((a, b) => (a.values[xCriterion.id] ?? 0) - (b.values[xCriterion.id] ?? 0));
  }, [alternatives, xCriterion, yCriterion]);

  // Construct path for the 2D Pareto frontier curve
  const frontierPath = useMemo(() => {
    if (twoDimPareto.length < 2) return '';
    return twoDimPareto
      .map((alt, idx) => {
        const x = scaleX(alt.values[xCriterion.id] ?? 0);
        const y = scaleY(alt.values[yCriterion.id] ?? 0);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [twoDimPareto, scaleX, scaleY, xCriterion, yCriterion]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-emerald-600" />
            2D 帕累托最优前沿交互散点图 (Pareto Frontier)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            自由选取任意两个指标维度进行切片投影，绿圈实心点为非劣前沿方案
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">X 轴:</span>
            <select
              value={xAxisId}
              onChange={(e) => setXAxisId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.direction === 'max' ? '↑极大' : '↓极小'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Y 轴:</span>
            <select
              value={yAxisId}
              onChange={(e) => setYAxisId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {criteria.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.direction === 'max' ? '↑极大' : '↓极小'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SVG Scatter Plot */}
      <div className="relative w-full overflow-x-auto pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = margin.top + pct * innerHeight;
            const x = margin.left + pct * innerWidth;
            return (
              <React.Fragment key={pct}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
              </React.Fragment>
            );
          })}

          {/* Hard Constraint Boundary Lines if present */}
          {xCriterion.constraintMin !== undefined &&
            xCriterion.constraintMin >= xMin &&
            xCriterion.constraintMin <= xMax && (
              <g>
                <line
                  x1={scaleX(xCriterion.constraintMin)}
                  y1={margin.top}
                  x2={scaleX(xCriterion.constraintMin)}
                  y2={height - margin.bottom}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={scaleX(xCriterion.constraintMin) + 4}
                  y={margin.top + 14}
                  fill="#f43f5e"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  X≥{xCriterion.constraintMin}
                </text>
              </g>
            )}

          {xCriterion.constraintMax !== undefined &&
            xCriterion.constraintMax >= xMin &&
            xCriterion.constraintMax <= xMax && (
              <g>
                <line
                  x1={scaleX(xCriterion.constraintMax)}
                  y1={margin.top}
                  x2={scaleX(xCriterion.constraintMax)}
                  y2={height - margin.bottom}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={scaleX(xCriterion.constraintMax) - 4}
                  y={margin.top + 14}
                  textAnchor="end"
                  fill="#f43f5e"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  X≤{xCriterion.constraintMax}
                </text>
              </g>
            )}

          {yCriterion.constraintMin !== undefined &&
            yCriterion.constraintMin >= yMin &&
            yCriterion.constraintMin <= yMax && (
              <g>
                <line
                  x1={margin.left}
                  y1={scaleY(yCriterion.constraintMin)}
                  x2={width - margin.right}
                  y2={scaleY(yCriterion.constraintMin)}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - margin.right - 4}
                  y={scaleY(yCriterion.constraintMin) - 4}
                  textAnchor="end"
                  fill="#f43f5e"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  Y≥{yCriterion.constraintMin}
                </text>
              </g>
            )}

          {yCriterion.constraintMax !== undefined &&
            yCriterion.constraintMax >= yMin &&
            yCriterion.constraintMax <= yMax && (
              <g>
                <line
                  x1={margin.left}
                  y1={scaleY(yCriterion.constraintMax)}
                  x2={width - margin.right}
                  y2={scaleY(yCriterion.constraintMax)}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - margin.right - 4}
                  y={scaleY(yCriterion.constraintMax) - 4}
                  textAnchor="end"
                  fill="#f43f5e"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  Y≤{yCriterion.constraintMax}
                </text>
              </g>
            )}

          {/* Pareto Frontier Connecting Line */}
          {frontierPath && (
            <path
              d={frontierPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              opacity="0.85"
            />
          )}

          {/* Points */}
          {alternatives.map((alt) => {
            const rawX = alt.values[xCriterion.id] ?? 0;
            const rawY = alt.values[yCriterion.id] ?? 0;
            const cx = scaleX(rawX);
            const cy = scaleY(rawY);
            const isSelected = selectedAlternativeId === alt.id;
            const is2DPareto = twoDimPareto.some((p) => p.id === alt.id);
            const isGlobalPareto = alt.isPareto;

            let fillColor = '#94a3b8'; // Default dominated
            let strokeColor = '#64748b';

            if (!alt.isFeasible) {
              fillColor = '#fee2e2'; // Infeasible
              strokeColor = '#ef4444';
            } else if (isGlobalPareto) {
              fillColor = '#10b981'; // Global Pareto
              strokeColor = '#047857';
            } else if (is2DPareto) {
              fillColor = '#38bdf8'; // 2D slice Pareto
              strokeColor = '#0284c7';
            }

            return (
              <g
                key={alt.id}
                className="cursor-pointer transition-transform duration-150"
                onClick={() => onSelectAlternative(alt.id)}
                onMouseEnter={() => setHoveredAlt(alt)}
                onMouseLeave={() => setHoveredAlt(null)}
              >
                {/* Selection Halo */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="14"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  />
                )}

                {/* Point */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 8 : 6.5}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={alt.isFeasible ? '2' : '2'}
                  strokeDasharray={alt.isFeasible ? 'none' : '3 2'}
                  className="hover:scale-125 transition-transform"
                />

                {/* Label */}
                <text
                  x={cx}
                  y={cy - 11}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={isSelected ? '#0f172a' : '#475569'}
                  className="pointer-events-none select-none"
                >
                  {alt.code}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Axis Labels & Values */}
          <text
            x={width / 2}
            y={height - 12}
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#334155"
          >
            {xCriterion.name} ({xCriterion.unit}) [{xCriterion.direction === 'max' ? '极大优' : '极小优'}]
          </text>
          <text
            x={-(margin.top + innerHeight / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#334155"
          >
            {yCriterion.name} ({yCriterion.unit}) [{yCriterion.direction === 'max' ? '极大优' : '极小优'}]
          </text>

          {/* Axis ticks */}
          <text
            x={margin.left}
            y={height - margin.bottom + 16}
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            fill="#64748b"
          >
            {xMin.toFixed(1)}
          </text>
          <text
            x={width - margin.right}
            y={height - margin.bottom + 16}
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            fill="#64748b"
          >
            {xMax.toFixed(1)}
          </text>
          <text
            x={margin.left - 8}
            y={height - margin.bottom}
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
            fill="#64748b"
          >
            {yMin.toFixed(1)}
          </text>
          <text
            x={margin.left - 8}
            y={margin.top + 6}
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
            fill="#64748b"
          >
            {yMax.toFixed(1)}
          </text>
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredAlt && (
          <div className="absolute top-4 right-4 bg-slate-900/95 text-white text-xs p-3 rounded-lg shadow-lg pointer-events-none backdrop-blur-sm max-w-xs z-20 border border-slate-700">
            <div className="font-semibold text-slate-100 flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span>{hoveredAlt.name}</span>
              <span className="font-mono text-emerald-400">
                {hoveredAlt.isPareto ? '★ 全局Pareto' : '次优/被支配'}
              </span>
            </div>
            <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>{xCriterion.name}:</span>
                <span className="font-bold text-white">
                  {hoveredAlt.values[xCriterion.id]} {xCriterion.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{yCriterion.name}:</span>
                <span className="font-bold text-white">
                  {hoveredAlt.values[yCriterion.id]} {yCriterion.unit}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                <span>TOPSIS贴近度:</span>
                <span className="text-sky-300 font-bold">{hoveredAlt.topsisCloseness.toFixed(3)}</span>
              </div>
              {!hoveredAlt.isFeasible && (
                <div className="text-rose-400 pt-1 flex items-center gap-1 text-[10px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>
                    违背硬约束: {hoveredAlt.violatedConstraints.map((v) => v.limit).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-emerald-700"></span>
            <span>全局帕累托最优解 (Pareto Frontier)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-400 inline-block border border-slate-500"></span>
            <span>可行但被支配方案</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-100 inline-block border border-rose-500 border-dashed"></span>
            <span>违背硬约束方案 (不可行)</span>
          </div>
        </div>

        <div className="text-slate-500 text-[11px]">
          共 {alternatives.filter((a) => a.isPareto).length} 个全局非劣解 · 虚线为当前两指标投影有效包络线
        </div>
      </div>
    </div>
  );
};
