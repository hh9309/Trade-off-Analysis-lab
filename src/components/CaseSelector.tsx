import React from 'react';
import { CaseStudy } from '../types/tradeoff';
import { CASE_STUDIES } from '../data/cases';
import { Sparkles, ArrowRight, Layers, Flame, Zap, Satellite, Building2, Server, Compass } from 'lucide-react';

interface Props {
  activeCaseId: string;
  onSelectCase: (caseStudy: CaseStudy) => void;
}

export const CaseSelector: React.FC<Props> = ({ activeCaseId, onSelectCase }) => {
  const activeCase = CASE_STUDIES.find((c) => c.id === activeCaseId) || CASE_STUDIES[0];

  const getCaseIcon = (id: string) => {
    switch (id) {
      case 'case-rocket':
        return Flame;
      case 'case-ev':
        return Zap;
      case 'case-satcom':
        return Satellite;
      case 'case-smartcity':
        return Building2;
      case 'case-datacenter':
        return Server;
      case 'case-uav':
        return Compass;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-4">
      {/* 6 Case Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CASE_STUDIES.map((c) => {
          const isSelected = c.id === activeCaseId;
          const Icon = getCaseIcon(c.id);

          return (
            <button
              key={c.id}
              onClick={() => onSelectCase(c)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-300' : 'text-slate-600'}`} />
                  <span
                    className={`text-[10px] font-mono ${
                      isSelected ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {c.category.slice(0, 4)}
                  </span>
                </div>
                <div className="font-semibold text-xs leading-tight line-clamp-2">{c.name}</div>
              </div>
              <div
                className={`text-[10px] mt-2 line-clamp-1 ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {c.tagline}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Case Hero Callout */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-mono">{activeCase.category}</span>
            <span className="text-slate-300">·</span>
            <h2 className="text-base font-bold text-slate-900">{activeCase.name}</h2>
          </div>
          <span className="text-xs font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-0.5">
            {activeCase.tagline}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs leading-relaxed text-slate-600">
          <div>
            <span className="font-semibold text-slate-800 block mb-0.5">工程论证背景：</span>
            <p>{activeCase.background}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-800 block mb-0.5">多属性权衡两难博弈：</span>
            <p className="text-rose-900 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
              {activeCase.tradeoffDilemma}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
