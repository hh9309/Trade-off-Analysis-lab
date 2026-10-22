import React from 'react';
import { Download, Bot, Sparkles, Compass, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface Props {
  caseName: string;
  category: string;
  tagline: string;
  feasibleCount: number;
  paretoCount: number;
  totalCount: number;
  onOpenExport: () => void;
  onToggleAi: () => void;
  isAiOpen: boolean;
}

export const CentralHeader: React.FC<Props> = ({
  caseName,
  category,
  tagline,
  feasibleCount,
  paretoCount,
  totalCount,
  onOpenExport,
  onToggleAi,
  isAiOpen,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
      {/* Top Row: Brand Title, Tagline & Primary Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 inline-block"></span>
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              系统工程决策分析
            </span>
            <span className="text-xs text-slate-400 font-mono">Systems Engineering Trade Study Lab</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            系统方案权衡分析实验室
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            多属性决策比较、帕累托最优前沿识别与系统架构优选决策工作台
          </p>
        </div>

        {/* Central Core Action Buttons: 导出权衡白皮书 & AI 权衡随诊专家 */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* AI 权衡随诊专家 Button */}
          <button
            onClick={onToggleAi}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isAiOpen
                ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-sky-500" />
            <span>AI 权衡随诊专家</span>
            <span className="bg-sky-200/70 text-sky-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              随诊中
            </span>
          </button>

          {/* 导出权衡白皮书 Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs hover:shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>导出权衡白皮书</span>
            <span className="text-slate-400 text-[10px] font-mono">PDF/CSV/MD</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Current Case Context & Live Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="text-slate-400 font-mono">当前案例:</span>
          <span className="font-bold text-slate-900">{caseName}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">{tagline}</span>
        </div>

        {/* Real-time Metric Indicators */}
        <div className="flex items-center gap-4 font-mono text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">方案总数:</span>
            <strong className="text-slate-800">{totalCount}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-400">可行解:</span>
            <strong className="text-emerald-700">{feasibleCount}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-slate-400">帕累托最优:</span>
            <strong className="text-sky-700">{paretoCount}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
