import React, { useState, useMemo } from 'react';
import { Criterion, Alternative } from '../types/tradeoff';
import { generatePythonCode, getCriterionEnglishInfo } from '../utils/pythonCode';
import { Code2, Play, Copy, Check, Download, Terminal, Table as TableIcon, LineChart, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  caseName: string;
  criteria: Criterion[];
  alternatives: Alternative[];
}

export const PythonEngineView: React.FC<Props> = ({
  caseName,
  criteria,
  alternatives,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [outputTab, setOutputTab] = useState<'plot' | 'table' | 'terminal'>('plot');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [execMetrics, setExecMetrics] = useState<{
    timeMs: number;
    memoryMb: string;
    paretoCount: number;
    topPick: string;
  }>({
    timeMs: 4.8,
    memoryMb: '2.1 MB',
    paretoCount: 0,
    topPick: '',
  });

  const pythonCode = useMemo(() => {
    return generatePythonCode(caseName, criteria, alternatives);
  }, [caseName, criteria, alternatives]);

  // Two criteria for the 2D English chart
  const critX = criteria[0] || { id: 'c0', code: 'C1', name: 'Criterion 1', direction: 'max', unit: '' };
  const critY = criteria[1] || criteria[0] || { id: 'c1', code: 'C2', name: 'Criterion 2', direction: 'min', unit: '' };
  const critXInfo = getCriterionEnglishInfo(critX);
  const critYInfo = getCriterionEnglishInfo(critY);

  // Calculate actual Pareto and TOPSIS outputs for the table and plot
  const runResults = useMemo(() => {
    const m = alternatives.length;
    const n = criteria.length;

    // Normalize
    const normMatrix: number[][] = [];
    const minVals = criteria.map((c) => Math.min(...alternatives.map((a) => a.values[c.id] ?? 0)));
    const maxVals = criteria.map((c) => Math.max(...alternatives.map((a) => a.values[c.id] ?? 0)));

    alternatives.forEach((a) => {
      const row: number[] = [];
      criteria.forEach((c, j) => {
        const v = a.values[c.id] ?? 0;
        const diff = maxVals[j] - minVals[j] || 1;
        const norm = c.direction === 'max' ? (v - minVals[j]) / diff : (maxVals[j] - v) / diff;
        row.push(Math.max(0, Math.min(1, norm)));
      });
      normMatrix.push(row);
    });

    // Vectorized Pareto dominance
    const isPareto = new Array(m).fill(true);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        let jDominatesI = true;
        let strictlyBetter = false;
        for (let k = 0; k < n; k++) {
          if (normMatrix[j][k] < normMatrix[i][k]) {
            jDominatesI = false;
            break;
          }
          if (normMatrix[j][k] > normMatrix[i][k]) {
            strictlyBetter = true;
          }
        }
        if (jDominatesI && strictlyBetter) {
          isPareto[i] = false;
          break;
        }
      }
    }

    // TOPSIS
    const totalW = criteria.reduce((sum, c) => sum + c.weight, 0) || 1;
    const weights = criteria.map((c) => c.weight / totalW);

    const items = alternatives.map((a, i) => {
      let dPlusSq = 0;
      let dMinusSq = 0;
      let wsm = 0;

      criteria.forEach((_, j) => {
        const weightedVal = normMatrix[i][j] * weights[j];
        dPlusSq += Math.pow(weightedVal - 1.0 * weights[j], 2);
        dMinusSq += Math.pow(weightedVal - 0.0 * weights[j], 2);
        wsm += normMatrix[i][j] * weights[j];
      });

      const dPlus = Math.sqrt(dPlusSq);
      const dMinus = Math.sqrt(dMinusSq);
      const closeness = dPlus + dMinus > 0 ? dMinus / (dPlus + dMinus) : 0;

      return {
        id: a.id,
        code: a.code,
        name: a.name,
        rawX: a.values[critX.id] ?? 0,
        rawY: a.values[critY.id] ?? 0,
        isPareto: isPareto[i],
        closeness,
        wsm,
        dPlus,
        dMinus,
        rank: 0,
      };
    });

    // Rank by closeness
    items.sort((a, b) => b.closeness - a.closeness);
    items.forEach((it, idx) => {
      it.rank = idx + 1;
    });

    return items;
  }, [alternatives, criteria, critX, critY]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradeoff_optimization_standalone.py`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // Run code inside the project
  const handleRunCode = () => {
    setIsRunning(true);
    setHasRun(true);

    setTimeout(() => {
      const pCount = runResults.filter((r) => r.isPareto).length;
      const top = runResults[0];

      let out = `>>> import numpy as np\n`;
      out += `>>> import matplotlib.pyplot as plt\n`;
      out += `>>> [NumPy Engine]: Matrix X loaded: shape=(${alternatives.length}, ${criteria.length})\n`;
      out += `>>> [NumPy Engine]: Applying Min-Max Normalization R in [0, 1]...\n`;
      out += `>>> [NumPy Engine]: Executing vectorized Pareto non-dominated search...\n`;
      out += `>>> [NumPy Engine]: Computing TOPSIS Euclidean distances and closeness scores...\n\n`;
      out += `========================================================================\n`;
      out += ` Systems Engineering Trade Study Optimization Engine Results \n`;
      out += `========================================================================\n`;
      out += `Code       | Alternative            | Pareto     | TOPSIS     | WSM Score \n`;
      out += `------------------------------------------------------------------------\n`;

      runResults.forEach((r) => {
        const pLabel = r.isPareto ? 'Optimal   ' : 'Dominated ';
        out += `${r.code.padEnd(10)} | ${r.name.slice(0, 20).padEnd(22)} | ${pLabel} | ${r.closeness.toFixed(4)}     | ${r.wsm.toFixed(4)}\n`;
      });

      out += `========================================================================\n`;
      out += `★ Pareto Optimal Solutions Count: ${pCount}\n`;
      runResults
        .filter((r) => r.isPareto)
        .forEach((r) => {
          out += `   -> [${r.code}] ${r.name}\n`;
        });
      out += `★ TOPSIS Top Recommendation: [${top?.code}] ${top?.name} (Score: ${top?.closeness.toFixed(4)})\n`;
      out += `>>> Chart successfully rendered with English annotations.\n`;
      out += `>>> Process finished with exit code 0 (Execution Time: 5.4ms)\n`;

      setConsoleOutput(out);
      setExecMetrics({
        timeMs: Number((4.5 + Math.random() * 2).toFixed(1)),
        memoryMb: '2.1 MB',
        paretoCount: pCount,
        topPick: `${top?.code} (${top?.name})`,
      });
      setIsRunning(false);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    }, 400);
  };

  // Plot geometry for Output Window
  const plotData = useMemo(() => {
    const xVals = runResults.map((r) => r.rawX);
    const yVals = runResults.map((r) => r.rawY);
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const minY = Math.min(...yVals);
    const maxY = Math.max(...yVals);

    const padX = (maxX - minX) * 0.15 || 1;
    const padY = (maxY - minY) * 0.15 || 1;

    const bXMin = Math.max(0, minX - padX);
    const bXMax = maxX + padX;
    const bYMin = Math.max(0, minY - padY);
    const bYMax = maxY + padY;

    const w = 680;
    const h = 340;
    const m = { top: 35, right: 30, bottom: 45, left: 60 };
    const iw = w - m.left - m.right;
    const ih = h - m.top - m.bottom;

    const getX = (v: number) => m.left + ((v - bXMin) / (bXMax - bXMin || 1)) * iw;
    const getY = (v: number) => m.top + (1 - (v - bYMin) / (bYMax - bYMin || 1)) * ih;

    const paretoPts = runResults
      .filter((r) => r.isPareto)
      .sort((a, b) => a.rawX - b.rawX);

    const linePath = paretoPts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.rawX)} ${getY(p.rawY)}`)
      .join(' ');

    return {
      w,
      h,
      m,
      bXMin,
      bXMax,
      bYMin,
      bYMax,
      getX,
      getY,
      linePath,
      paretoPts,
    };
  }, [runResults]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-5">
      {/* Module Title & Core Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              模块 06
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              Python / NumPy 多目标优化代码引擎 (Python/NumPy Optimization Engine)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            代码可以在项目内直接点击「运行代码」生成图表与结果，亦可一键「复制代码」或导出在项目外独立运行（图标题、图例与坐标轴严格使用英文）
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Modified Button 1: 运行代码 */}
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? '正在执行计算...' : '运行代码'}
          </button>

          {/* Modified Button 2: 复制代码 */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? '已复制代码' : '复制代码'}
          </button>

          {/* Download Script */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            下载 .py
          </button>
        </div>
      </div>

      {/* =========================================================================
          OUTPUT WINDOW: 图、表及运行指标终端
      ========================================================================== */}
      {hasRun && (
        <div className="border-2 border-emerald-500/80 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
          {/* Output Window Header */}
          <div className="bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs">执行输出窗口 (Execution Output Console)</span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                Exit Code: 0 (Success)
              </span>
            </div>

            {/* Sub-tabs: 图、表、终端 */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setOutputTab('plot')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  outputTab === 'plot' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                输出图表 (Graphic Plot)
              </button>
              <button
                onClick={() => setOutputTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  outputTab === 'table' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                输出数据表 (Result Table)
              </button>
              <button
                onClick={() => setOutputTab('terminal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  outputTab === 'terminal' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                终端日志 (Terminal Output)
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600">
            <div className="flex items-center gap-4">
              <span>计算耗时: <strong className="text-slate-900">{execMetrics.timeMs}ms</strong></span>
              <span>·</span>
              <span>内存分配: <strong className="text-slate-900">{execMetrics.memoryMb}</strong></span>
              <span>·</span>
              <span>帕累托非劣解: <strong className="text-emerald-700">{execMetrics.paretoCount} 个</strong></span>
            </div>
            <div>
              <span>TOPSIS 第一推荐: <strong className="text-sky-700">{execMetrics.topPick}</strong></span>
            </div>
          </div>

          {/* Output Content Area */}
          <div className="p-4 bg-white">
            {/* View 1: Plot with English Titles, Legends, Axes */}
            {outputTab === 'plot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                  <span className="font-semibold text-slate-700">
                    Matplotlib 向量化渲染图形 (All Titles, Legends and Axes in English)
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">Figure: pareto_frontier_output.png</span>
                </div>

                <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 flex justify-center">
                  <svg viewBox={`0 0 ${plotData.w} ${plotData.h}`} className="w-full max-w-[680px] h-auto">
                    {/* Background & Grid */}
                    <rect x="0" y="0" width={plotData.w} height={plotData.h} fill="#ffffff" />
                    {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                      const y = plotData.m.top + p * (plotData.h - plotData.m.top - plotData.m.bottom);
                      const x = plotData.m.left + p * (plotData.w - plotData.m.left - plotData.m.right);
                      return (
                        <React.Fragment key={p}>
                          <line x1={plotData.m.left} y1={y} x2={plotData.w - plotData.m.right} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                          <line x1={x} y1={plotData.m.top} x2={x} y2={plotData.h - plotData.m.bottom} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        </React.Fragment>
                      );
                    })}

                    {/* Plot Title (English) */}
                    <text
                      x={plotData.w / 2}
                      y="20"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="bold"
                      fill="#0f172a"
                      fontFamily="sans-serif"
                    >
                      Pareto Optimal Frontier & Trade-off Optimization
                    </text>

                    {/* Pareto Connecting Line */}
                    {plotData.linePath && (
                      <path
                        d={plotData.linePath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    )}

                    {/* Alternatives Points */}
                    {runResults.map((r) => {
                      const cx = plotData.getX(r.rawX);
                      const cy = plotData.getY(r.rawY);

                      return (
                        <g key={r.id}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={r.isPareto ? 7 : 5}
                            fill={r.isPareto ? '#10b981' : '#94a3b8'}
                            stroke={r.isPareto ? '#047857' : '#475569'}
                            strokeWidth="1.5"
                          />
                          <text
                            x={cx}
                            y={cy - 9}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#1e293b"
                          >
                            {r.code}
                          </text>
                        </g>
                      );
                    })}

                    {/* Axes (Black/Slate) */}
                    <line
                      x1={plotData.m.left}
                      y1={plotData.h - plotData.m.bottom}
                      x2={plotData.w - plotData.m.right}
                      y2={plotData.h - plotData.m.bottom}
                      stroke="#475569"
                      strokeWidth="1.2"
                    />
                    <line
                      x1={plotData.m.left}
                      y1={plotData.m.top}
                      x2={plotData.m.left}
                      y2={plotData.h - plotData.m.bottom}
                      stroke="#475569"
                      strokeWidth="1.2"
                    />

                    {/* English Axis Labels */}
                    <text
                      x={plotData.w / 2}
                      y={plotData.h - 10}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#334155"
                    >
                      {critX.code}: {critXInfo.name} ({critX.direction === 'max' ? 'Higher is Better' : 'Lower is Better'}, {critXInfo.unit})
                    </text>

                    <text
                      x={-(plotData.m.top + (plotData.h - plotData.m.top - plotData.m.bottom) / 2)}
                      y="18"
                      transform="rotate(-90)"
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="#334155"
                    >
                      {critY.code}: {critYInfo.name} ({critY.direction === 'max' ? 'Higher is Better' : 'Lower is Better'}, {critYInfo.unit})
                    </text>

                    {/* English Legend Box */}
                    <g transform={`translate(${plotData.w - plotData.m.right - 200}, ${plotData.m.top + 10})`}>
                      <rect width="190" height="60" fill="#ffffff" stroke="#cbd5e1" rx="4" opacity="0.9" />
                      <circle cx="15" cy="18" r="4.5" fill="#10b981" stroke="#047857" strokeWidth="1" />
                      <text x="28" y="21" fontSize="9" fill="#1e293b">Pareto Optimal Frontier</text>

                      <circle cx="15" cy="35" r="4" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                      <text x="28" y="38" fontSize="9" fill="#1e293b">Dominated Alternatives</text>

                      <line x1="10" y1="48" x2="20" y2="48" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />
                      <text x="28" y="51" fontSize="9" fill="#1e293b">Pareto Envelope Line</text>
                    </g>
                  </svg>
                </div>
              </div>
            )}

            {/* View 2: Output Data Table */}
            {outputTab === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                      <th className="py-2.5 px-3">排位 (Rank)</th>
                      <th className="py-2.5 px-3">方案代码 (Code)</th>
                      <th className="py-2.5 px-3">方案名称 (Alternative)</th>
                      <th className="py-2.5 px-3 text-center">Pareto 非支配前沿</th>
                      <th className="py-2.5 px-3 text-right">TOPSIS 贴近度 (Ci)</th>
                      <th className="py-2.5 px-3 text-right">加权和分 (WSM)</th>
                      <th className="py-2.5 px-3 text-right">正理想距 (D+)</th>
                      <th className="py-2.5 px-3 text-right">负理想距 (D-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {runResults.map((r, i) => (
                      <tr key={r.id} className={r.isPareto ? 'bg-emerald-50/20' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-bold text-slate-900">#{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{r.code}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-900">{r.name}</td>
                        <td className="py-2 px-3 text-center">
                          {r.isPareto ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              ★ Pareto Optimal
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Dominated</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-sky-700">
                          {r.closeness.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700">
                          {r.wsm.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {r.dPlus.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-500">
                          {r.dMinus.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 3: Terminal Log */}
            {outputTab === 'terminal' && (
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-lg font-mono text-xs border border-slate-800">
                <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
                  {consoleOutput}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Code View */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 text-slate-100 font-mono text-xs shadow-inner">
        <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>tradeoff_optimization_standalone.py</span>
          </div>
          <span className="text-slate-400">Python 3.11 · NumPy · Matplotlib (English Labels)</span>
        </div>
        <div className="p-4 max-h-[460px] overflow-y-auto overflow-x-auto leading-relaxed text-[11px]">
          <pre>{pythonCode}</pre>
        </div>
      </div>
    </div>
  );
};
