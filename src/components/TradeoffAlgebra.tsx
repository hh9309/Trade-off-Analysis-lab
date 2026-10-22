import React from 'react';
import { Criterion, EvaluatedAlternative } from '../types/tradeoff';
import { Calculator, CheckCircle2, Hash, Compass, Award, Sparkles, BookOpen } from 'lucide-react';
import { KatexMath } from './KatexMath';

interface Props {
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
}

export const TradeoffAlgebra: React.FC<Props> = ({ criteria, alternatives }) => {
  const m = alternatives.length;
  const n = criteria.length;
  const feasibleCount = alternatives.filter((a) => a.isFeasible).length;
  const paretoCount = alternatives.filter((a) => a.isPareto).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              模块 01
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              权衡分析代数与多目标决策建模 (Algebra & Multi-Objective Decision Modeling)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            形式化数学建模：决策矩阵 <KatexMath math="X \in \mathbb{R}^{m \times n}" />、无量纲化映射算子、帕累托支配非劣集代数推演与 TOPSIS 欧氏距离贴近度
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <span>方案维 <KatexMath math="m=" /> {m}</span>
          <span>·</span>
          <span>准则维 <KatexMath math="n=" /> {n}</span>
          <span>·</span>
          <span className="text-emerald-700 font-semibold">可行域 <KatexMath math="|F|=" /> {feasibleCount}</span>
          <span>·</span>
          <span className="text-indigo-700 font-semibold">Pareto集 <KatexMath math="|\mathcal{P}^*|=" /> {paretoCount}</span>
        </div>
      </div>

      {/* 4 Core Mathematical Formulas with KaTeX rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formula 1: Decision Matrix */}
        <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-slate-600" />
              1. 原始系统方案决策矩阵
            </span>
            <KatexMath math="X \in \mathbb{R}^{m \times n}" className="text-xs text-slate-500" />
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 overflow-x-auto">
            <KatexMath
              block
              math={`X = [x_{ij}]_{m \\times n} = \\begin{pmatrix} x_{11} & x_{12} & \\cdots & x_{1n} \\\\ x_{21} & x_{22} & \\cdots & x_{2n} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ x_{m1} & x_{m2} & \\cdots & x_{mn} \\end{pmatrix}`}
            />
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            行向量 <KatexMath math="\mathbf{x}_i \in \mathbb{R}^n" /> 代表候选方案 <KatexMath math="A_i" /> 的多属性状态；列向量代表各个工程准则维度（成本、运力、能耗等）。
          </p>
        </div>

        {/* Formula 2: Pareto Dominance */}
        <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              2. 帕累托严格支配与非劣集代数
            </span>
            <KatexMath math="A \succ B" className="text-xs font-bold text-emerald-700" />
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 overflow-x-auto space-y-2">
            <KatexMath
              block
              math={`A \\succ B \\iff \\big(\\forall j \\in \\{1,\\dots,n\\},\\, f_j(A) \\ge f_j(B)\\big) \\;\\land\\; \\big(\\exists k \\in \\{1,\\dots,n\\},\\, f_k(A) > f_k(B)\\big)`}
            />
            <KatexMath
              block
              math={`\\mathcal{P}^* = \\big\\{ A \\in \\mathcal{F} \\;\\big|\\; \\nexists B \\in \\mathcal{F},\\, B \\succ A \\big\\}`}
            />
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            在可行方案集 <KatexMath math="\mathcal{F}" /> 中不被任何其他方案严格支配的非劣解集合 <KatexMath math="\mathcal{P}^*" />，即为客观最优权衡前沿（Pareto Frontier）。
          </p>
        </div>

        {/* Formula 3: Normalization Operator */}
        <div className="p-4 bg-sky-50/40 border border-sky-200/70 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-950">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              3. 属性无量纲化映射算子
            </span>
            <KatexMath math="\phi: \\mathbb{R} \\to [0, 1]" className="text-xs font-mono text-sky-700" />
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-sky-200 overflow-x-auto space-y-2">
            <div className="text-[11px] font-semibold text-sky-800">效益型准则 (极大化效益):</div>
            <KatexMath
              block
              math={`r_{ij} = \\frac{x_{ij} - \\min_{k} x_{kj}}{\\max_{k} x_{kj} - \\min_{k} x_{kj}}`}
            />
            <div className="text-[11px] font-semibold text-indigo-800 pt-1">成本型准则 (极小化代价):</div>
            <KatexMath
              block
              math={`r_{ij} = \\frac{\\max_{k} x_{kj} - x_{ij}}{\\max_{k} x_{kj} - \\min_{k} x_{kj}}`}
            />
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            将异构量纲统一投影至闭区间 <KatexMath math="[0, 1]" />，消除由于绝对数值量级差异引起的分析失真。
          </p>
        </div>

        {/* Formula 4: TOPSIS & Closeness */}
        <div className="p-4 bg-amber-50/40 border border-amber-200/70 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              4. TOPSIS 欧氏距离与相对贴近度
            </span>
            <KatexMath math="C_i \\in [0, 1]" className="text-xs font-bold text-amber-700" />
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-amber-200 overflow-x-auto space-y-2">
            <KatexMath
              block
              math={`D_i^+ = \\sqrt{\\sum_{j=1}^n \\big(w_j r_{ij} - v_j^+\\big)^2}, \\qquad D_i^- = \\sqrt{\\sum_{j=1}^n \\big(w_j r_{ij} - v_j^-\\big)^2}`}
            />
            <KatexMath
              block
              math={`C_i = \\frac{D_i^-}{D_i^+ + D_i^-} \\qquad (C_i \\to 1 \\text{ 为全局最优})`}
            />
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            贴近度 <KatexMath math="C_i" /> 逼近 1 说明方案既无限接近正理想解 <KatexMath math="V^+" /> 又远离负理想解 <KatexMath math="V^-" />，提供全局最优折中排位。
          </p>
        </div>
      </div>

      {/* Extended Section 5: Shannon Entropy & WSM Scoring Formula */}
      <div className="p-4 bg-purple-50/40 border border-purple-200/70 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-purple-950">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            5. 香农信息熵客观赋权算子与加权求和（WSM）基准
          </span>
          <KatexMath math="w_j = \\frac{1 - e_j}{\\sum (1 - e_k)}" className="text-xs text-purple-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-white p-3 rounded-lg border border-purple-200 overflow-x-auto">
            <div className="text-[11px] font-semibold text-purple-800 mb-1">香农信息熵客观权重算子：</div>
            <KatexMath
              block
              math={`p_{ij} = \\frac{r_{ij}}{\\sum_{i=1}^m r_{ij}}, \\quad e_j = -\\frac{1}{\\ln m} \\sum_{i=1}^m p_{ij} \\ln(p_{ij}), \\quad w_j^* = \\frac{1 - e_j}{\\sum_{k=1}^n (1 - e_k)}`}
            />
          </div>
          <div className="bg-white p-3 rounded-lg border border-purple-200 overflow-x-auto">
            <div className="text-[11px] font-semibold text-purple-800 mb-1">加权求和模型 (WSM Score)：</div>
            <KatexMath
              block
              math={`S_i = \\sum_{j=1}^n w_j \\cdot r_{ij}, \\qquad S_i \\in [0, 1]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
