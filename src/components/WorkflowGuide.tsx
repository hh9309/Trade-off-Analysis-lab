import React from 'react';
import { Check, ChevronRight, Sliders, Table, Binary, Compass, Award } from 'lucide-react';

export type WorkflowStep = 1 | 2 | 3 | 4 | 5;

interface Props {
  currentStep: WorkflowStep;
  onSelectStep: (step: WorkflowStep) => void;
  showAllModules: boolean;
  onToggleShowAll: () => void;
}

export const WorkflowGuide: React.FC<Props> = ({
  currentStep,
  onSelectStep,
  showAllModules,
  onToggleShowAll,
}) => {
  const steps = [
    { id: 1, title: 'Step 1: 准则与硬约束定义', short: '准则定义', icon: Sliders },
    { id: 2, title: 'Step 2: 方案矩阵与可行性过滤', short: '方案录入', icon: Table },
    { id: 3, title: 'Step 3: 属性无量纲化映射', short: '无量纲化', icon: Binary },
    { id: 4, title: 'Step 4: 帕累托前沿多维识别', short: '帕累托前沿', icon: Compass },
    { id: 5, title: 'Step 5: TOPSIS排序与决策报告', short: '优选决策', icon: Award },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Step Indicators */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium py-1">
        {steps.map((s, idx) => {
          const isActive = currentStep === s.id && !showAllModules;
          const isPassed = currentStep > s.id;
          const Icon = s.icon;

          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => onSelectStep(s.id as WorkflowStep)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : isPassed
                    ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.short}</span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Show All / Single Step Toggle */}
      <button
        onClick={onToggleShowAll}
        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors shrink-0 ${
          showAllModules
            ? 'bg-sky-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        {showAllModules ? '当前: 全览工作台' : '切换全景全览视图'}
      </button>
    </div>
  );
};
