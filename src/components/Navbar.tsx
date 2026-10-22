import React from 'react';
import { Download } from 'lucide-react';

interface Props {
  onOpenExport: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<Props> = ({ onOpenExport, onNavigateSection }) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigateSection('cases');
        }}
        className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 inline-block"></span>
        系统方案权衡分析实验室
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600">
        <button
          onClick={() => onNavigateSection('cases')}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          实战案例
        </button>
        <button
          onClick={() => onNavigateSection('matrix')}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          决策矩阵
        </button>
        <button
          onClick={() => onNavigateSection('pareto')}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          帕累托前沿
        </button>
        <button
          onClick={() => onNavigateSection('engine')}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          代码引擎
        </button>
        <button
          onClick={() => onNavigateSection('knowledge')}
          className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
        >
          知识切片
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          导出权衡白皮书
        </button>
      </div>
    </header>
  );
};
