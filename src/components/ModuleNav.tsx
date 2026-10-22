import React from 'react';
import {
  Calculator,
  Table,
  Sliders,
  Compass,
  Briefcase,
  Code2,
  Bot,
  Route,
  FileDown,
  BookOpen,
  LayoutGrid,
} from 'lucide-react';

export type ActiveModuleId =
  | 'overview'
  | 'mod1_algebra'
  | 'mod2_matrix'
  | 'mod3_constraints'
  | 'mod4_pareto'
  | 'mod5_cases'
  | 'mod6_python'
  | 'mod7_ai'
  | 'mod8_workflow'
  | 'mod9_export'
  | 'mod10_slices';

interface Props {
  activeModule: ActiveModuleId;
  onSelectModule: (moduleId: ActiveModuleId) => void;
  feasibleCount: number;
  paretoCount: number;
}

export const MODULE_DEFINITIONS = [
  { id: 'overview' as const, num: '全览', name: '全景大屏', icon: LayoutGrid, desc: '综合决策大屏' },
  { id: 'mod1_algebra' as const, num: '01', name: '权衡代数', icon: Calculator, desc: '决策建模与数学原理' },
  { id: 'mod2_matrix' as const, num: '02', name: '方案矩阵', icon: Table, desc: '多属性指标与候选方案' },
  { id: 'mod3_constraints' as const, num: '03', name: '工程约束', icon: Sliders, desc: '硬约束边界与可行空间' },
  { id: 'mod4_pareto' as const, num: '04', name: '帕累托前沿', icon: Compass, desc: '多维非劣解识别与可视化' },
  { id: 'mod5_cases' as const, num: '05', name: '六大案例', icon: Briefcase, desc: '典型工程权衡实战库' },
  { id: 'mod6_python' as const, num: '06', name: '代码引擎', icon: Code2, desc: 'NumPy优化与仿真运行' },
  { id: 'mod7_ai' as const, num: '07', name: 'AI随诊', icon: Bot, desc: '权衡盲区诊断与大模型' },
  { id: 'mod8_workflow' as const, num: '08', name: '全流程导引', icon: Route, desc: '端到端权衡研制闭环' },
  { id: 'mod9_export' as const, num: '09', name: '报告导出', icon: FileDown, desc: '白皮书/CSV/打印' },
  { id: 'mod10_slices' as const, num: '10', name: '权衡要素', icon: BookOpen, desc: '四大核心切片与陷阱' },
];

export const ModuleNav: React.FC<Props> = ({
  activeModule,
  onSelectModule,
  feasibleCount,
  paretoCount,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-2 shadow-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">系统方案权衡分析 “10大” 核心模块索引：</span>
          <span className="text-slate-400 text-[11px]">点击直达各模块深度分析与专属交互视图</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>可行解: <strong className="text-slate-800">{feasibleCount}</strong></span>
          <span>·</span>
          <span>帕累托最优: <strong className="text-emerald-600">{paretoCount}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-11 gap-1.5">
        {MODULE_DEFINITIONS.map((mod) => {
          const isActive = activeModule === mod.id;
          const Icon = mod.icon;

          return (
            <button
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs ring-1 ring-slate-900'
                  : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isActive ? 'text-sky-300' : 'text-slate-400'
                  }`}
                >
                  {mod.num}
                </span>
                <Icon className="w-3.5 h-3.5 shrink-0" />
              </div>
              <span className="text-xs font-semibold whitespace-nowrap leading-tight">
                {mod.name}
              </span>
              <span
                className={`text-[9px] mt-0.5 line-clamp-1 hidden lg:block ${
                  isActive ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {mod.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
