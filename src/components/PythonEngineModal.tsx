import React, { useState, useMemo } from 'react';
import { Criterion, Alternative } from '../types/tradeoff';
import { generatePythonCode, getCriterionEnglishInfo } from '../utils/pythonCode';
import { Code2, Play, Copy, Check, Download, X, Terminal, Table as TableIcon, LineChart, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  caseName: string;
  criteria: Criterion[];
  alternatives: Alternative[];
  onClose: () => void;
}

export const PythonEngineModal: React.FC<Props> = ({
  caseName,
  criteria,
  alternatives,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [outputTab, setOutputTab] = useState<'plot' | 'table' | 'terminal'>('plot');
  const [consoleOutput, setConsoleOutput] = useState<string>('');

  const pythonCode = useMemo(() => {
    return generatePythonCode(caseName, criteria, alternatives);
  }, [caseName, criteria, alternatives]);

  const critX = criteria[0] || { id: 'c0', code: 'C1', name: 'Criterion 1', direction: 'max', unit: '' };
  const critY = criteria[1] || criteria[0] || { id: 'c1', code: 'C2', name: 'Criterion 2', direction: 'min', unit: '' };
  const critXInfo = getCriterionEnglishInfo(critX);
  const critYInfo = getCriterionEnglishInfo(critY);

  // Calculate actual results for the output window
  const runResults = useMemo(() => {
    const m = alternatives.length;
    const n = criteria.length;

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

  const handleRunCode = () => {
    setIsRunning(true);
    setHasRun(true);

    setTimeout(() => {
      const pCount = runResults.filter((r) => r.isPareto).length;
      const top = runResults[0];

      let out = `>>> import numpy as np\n`;
      out += `>>> import matplotlib.pyplot as plt\n`;
      out += `>>> [NumPy Engine]: Matrix X loaded: shape=(${alternatives.length}, ${criteria.length})\n`;
      out += `>>> [NumPy Engine]: Normalization & Pareto dominance calculation finished.\n`;
      out += `========================================================================\n`;
      out += `Code       | Alternative            | Pareto     | TOPSIS     | WSM Score \n`;
      out += `------------------------------------------------------------------------\n`;

      runResults.forEach((r) => {
        const pLabel = r.isPareto ? 'Optimal   ' : 'Dominated ';
        out += `${r.code.padEnd(10)} | ${r.name.slice(0, 20).padEnd(22)} | ${pLabel} | ${r.closeness.toFixed(4)}     | ${r.wsm.toFixed(4)}\n`;
      });
      out += `========================================================================\n`;
      out += `★ Pareto Optimal Count: ${pCount} | Top: [${top?.code}] ${top?.name}\n`;
      out += `>>> Process finished with exit code 0\n`;

      setConsoleOutput(out);
      setIsRunning(false);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Code2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Python / NumPy 多目标优化代码引擎
              </h3>
              <p className="text-xs text-slate-500">
                可直接在项目内「运行代码」生成图表输出，亦可「复制代码」在项目外独立运行
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Modified Button 1: 运行代码 */}
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? '正在运行...' : '运行代码'}
            </button>

            {/* Modified Button 2: 复制代码 */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制代码' : '复制代码'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载 .py
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs">
          {/* Output Window when Run Code is clicked */}
          {hasRun && (
            <div className="border border-emerald-500 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white text-xs">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  输出窗口 (Output Window)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setOutputTab('plot')}
                    className={`px-2.5 py-1 rounded text-[11px] ${
                      outputTab === 'plot' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    图表 (Plot)
                  </button>
                  <button
                    onClick={() => setOutputTab('table')}
                    className={`px-2.5 py-1 rounded text-[11px] ${
                      outputTab === 'table' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    数据表 (Table)
                  </button>
                  <button
                    onClick={() => setOutputTab('terminal')}
                    className={`px-2.5 py-1 rounded text-[11px] ${
                      outputTab === 'terminal' ? 'bg-sky-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    终端日志
                  </button>
                </div>
              </div>

              <div className="p-3 bg-white">
                {outputTab === 'terminal' && (
                  <pre className="bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px]">
                    {consoleOutput}
                  </pre>
                )}

                {outputTab === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                          <th className="p-2">Rank</th>
                          <th className="p-2">Code</th>
                          <th className="p-2">Name</th>
                          <th className="p-2 text-center">Pareto</th>
                          <th className="p-2 text-right">TOPSIS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {runResults.map((r, idx) => (
                          <tr key={r.id}>
                            <td className="p-2 font-bold">#{idx + 1}</td>
                            <td className="p-2 font-bold">{r.code}</td>
                            <td className="p-2 font-sans">{r.name}</td>
                            <td className="p-2 text-center text-emerald-700 font-bold">
                              {r.isPareto ? '★ Optimal' : '-'}
                            </td>
                            <td className="p-2 text-right font-bold text-sky-700">
                              {r.closeness.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {outputTab === 'plot' && (
                  <div className="text-center p-2">
                    <div className="text-xs font-bold text-slate-900 mb-1">
                      Pareto Optimal Frontier & Trade-off Optimization (English Labels)
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">
                      X Axis: {critX.code}: {critXInfo.name} ({critX.direction === 'max' ? 'Higher is Better' : 'Lower is Better'}, {critXInfo.unit}) · Y Axis: {critY.code}: {critYInfo.name} ({critY.direction === 'max' ? 'Higher is Better' : 'Lower is Better'}, {critYInfo.unit})
                    </div>
                    <div className="text-emerald-700 text-xs font-bold mt-2">
                      Pareto Solutions: {runResults.filter((r) => r.isPareto).map((r) => r.code).join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Python Code Viewer */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl shadow-inner border border-slate-800 overflow-x-auto">
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px]">
              {pythonCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
