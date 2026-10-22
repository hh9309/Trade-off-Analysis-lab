import React, { useState } from 'react';
import { BookOpen, Layers, ShieldAlert, Compass, CheckCircle2, AlertTriangle } from 'lucide-react';
import { KatexMath } from './KatexMath';

export const KnowledgeSlices: React.FC = () => {
  const [activeSlice, setActiveSlice] = useState<number>(1);

  const slices = [
    {
      id: 1,
      title: '切片一：权衡分析基本要素的多维空间解构',
      subtitle: '候选方案 (A) · 评价准则 (C) · 决策偏好 (P)',
      icon: Layers,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      badge: '系统工程三要素',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            系统方案权衡（Trade Study / Analysis of Alternatives, AoA）是系统工程（Systems Engineering）生命周期论证阶段最核心的方法论工具。它由<strong>三大基本元语</strong>交织构成：
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">1. 候选方案集 (Alternatives)</span>
              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                <KatexMath math="\mathcal{A} = \{ A_1, A_2, \dots, A_m \}" />
              </div>
              <p className="text-slate-600 text-[11px]">
                方案需具备足够的工程可行性与架构差异度，构成解空间的离散采样点。
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">2. 评价准则维 (Criteria)</span>
              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                <KatexMath math="\mathbf{f}(A) = [f_1(A), f_2(A), \dots, f_n(A)]^T" />
              </div>
              <p className="text-slate-600 text-[11px]">
                多属性向量，涵盖技术性能、全寿命周期成本（LCC）、可靠度、研制周期等异构冲突指标。
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs">3. 决策偏好权 (Preferences)</span>
              <div className="bg-white p-2 rounded border border-slate-200 text-center">
                <KatexMath math="\mathbf{w} = [w_1, \dots, w_n], \quad \sum_{j=1}^n w_j = 1" />
              </div>
              <p className="text-slate-600 text-[11px]">
                体现工程型号总师、军方用户或商业投资人对各目标重视程度的量化折中。
              </p>
            </div>
          </div>

          <div className="bg-slate-100/70 p-3.5 rounded-lg border border-slate-200/70">
            <strong>核心洞见：</strong> 面对冲突性目标（如“极致性能必然伴随高昂成本与漫长研制周期”），传统单一主观打分往往掩盖了方案间的本质工程权衡。权衡分析通过求解<strong>多目标帕累托前沿</strong> <KatexMath math="\mathcal{P}^* \subset \mathcal{F}" />，彻底打破单一主观分数的局限，揭示方案间的客观有效边界。
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '切片二：帕累托前沿与非劣解优势',
      subtitle: 'Pareto Dominance · 非劣有效集 · 边界折中',
      icon: Compass,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badge: '多目标决策代数',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            帕累托最优（Pareto Optimality）是运筹优化与经济学中最高效的决策准则。
          </p>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-lg text-slate-800 space-y-2">
            <div className="font-bold text-emerald-900 text-xs">帕累托严格支配定义 (Pareto Dominance)：</div>
            <p className="text-xs text-slate-600">
              方案 <KatexMath math="A" /> 严格支配方案 <KatexMath math="B" />（记作 <KatexMath math="A \succ B" />），当且仅当满足两个充要条件：
            </p>
            <div className="bg-white p-3 rounded border border-emerald-200 space-y-2 text-center">
              <KatexMath
                block
                math={`A \\succ B \\iff \\big(\\forall j \\in \\{1, \\dots, n\\},\\, f_j(A) \\ge f_j(B)\\big) \\;\\land\\; \\big(\\exists k \\in \\{1, \\dots, n\\},\\, f_k(A) > f_k(B)\\big)`}
              />
              <KatexMath
                block
                math={`\\mathcal{P}^* = \\big\\{ A \\in \\mathcal{F} \\;\\big|\\; \\nexists B \\in \\mathcal{F},\\, B \\succ A \\big\\}`}
              />
            </div>
          </div>

          <p>
            <strong>非劣解（Non-dominated Alternatives）的不可替代优势：</strong>
            如果一个方案没有被其他任何可行方案所支配，则它属于<strong>帕累托最优解集（Pareto Set）</strong> <KatexMath math="\mathcal{P}^*" />。这些方案在目标空间构成的超曲面即为<strong>帕累托前沿（Pareto Frontier）</strong>。
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li><strong>零无谓浪费：</strong> 帕累托最优保证了在不恶化任一其他指标的前提下，无法改善任何单一指标。</li>
            <li><strong>客观边界呈现：</strong> 帕累托前沿完全由客观物理规律与方案参数决定，独立于任何人为打分偏好。</li>
            <li><strong>灵活决策支持：</strong> 决策者可在前沿曲线上根据实际财政预算或紧急度自由选取折中方案，而绝不在前沿下方的被支配劣解上浪费宝贵资源。</li>
          </ul>
        </div>
      ),
    },
    {
      id: 3,
      title: '切片三：三大致命权衡决策陷阱',
      subtitle: '警惕盲目加权 · 排除多重共线性 · 坚守硬边界',
      icon: ShieldAlert,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      badge: '工程避坑指南',
      content: (
        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-rose-50/40 border border-rose-200 rounded-lg">
            <div className="font-bold text-rose-900 text-sm mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              陷阱一：盲目简单加权平均（掩盖一票否决指标致命短板）
            </div>
            <div className="text-slate-600 mt-1 space-y-1">
              <div>
                <strong>现象：</strong> 很多评审盲目采用加权求和 <KatexMath math="S_i = \sum_{j=1}^n w_j r_{ij}" />，某个方案在成本与性能上得分极高，但在关键可靠性或安全性上存在致命缺陷，平均分依然名列前茅。
              </div>
              <div>
                <strong>对策：</strong> 严格设定<strong>工程硬约束过滤门槛</strong>（如 <KatexMath math="g_k(\mathbf{x}) \le 0" />），不达标者判定为不可行域 <KatexMath math="\mathcal{F}^c" />，强制直接淘汰，不得参与综合折中。
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg">
            <div className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              陷阱二：指标间严重的多重共线性（导致隐性权重失真）
            </div>
            <div className="text-slate-600 mt-1 space-y-1">
              <div>
                <strong>现象：</strong> 评价体系中同时设置了“发动机推力”、“起飞加速时间”、“爬升率”三个物理高度同源的指标，相关系数 <KatexMath math="\rho_{jk} \to 1" />，导致性能维度被反复重复计分，实质上无形放大了该维度的权重。
              </div>
              <div>
                <strong>对策：</strong> 指标筛选遵循相互正交性原则，并借助<strong>信息熵权法</strong> <KatexMath math="w_j^* = \frac{1 - e_j}{\sum (1 - e_k)}" /> 检验各指标的独立变异信息量。
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
              陷阱三：忽视边界硬约束导致“纸面完美但现实违约”
            </div>
            <div className="text-slate-600 mt-1 space-y-1">
              <div>
                <strong>现象：</strong> 算法推荐了全固态电池或全浸没液冷方案，理论综合效能冠绝群雄，但其采购成本远超客户年度总预算红线 <KatexMath math="C > C_{\max}" />。
              </div>
              <div>
                <strong>对策：</strong> 先过滤、后排序。在算法求解的第一阶段必须进行约束可行性投影 <KatexMath math="\mathcal{F} = \{ A_i \mid \forall k, \, g_k(A_i) \le b_k \}" />。
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '切片四：误区警示与诊断陷阱',
      subtitle: '警惕“唯一绝对最优解”思维 · 拥抱多元折中',
      icon: CheckCircle2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      badge: '战略决策哲学',
      content: (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/70 rounded-lg">
            <div className="font-bold text-indigo-900 text-sm mb-1.5">
              警惕传统“寻找全能唯一最优解”的思维误区
            </div>
            <p className="text-slate-700">
              在复杂工程系统的多目标博弈中，<strong>天然不存在“成本最低、性能最高、研制最快且可靠性最强”的全能神级方案</strong>。物理规律与工程经济学决定了各项指标必然相互掣肘。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900 block mb-1">科学决策理念：</span>
              <p className="text-slate-600">
                系统权衡的本质不是寻找“唯一答案”，而是<strong>为决策者呈现一个清晰、透明、量化支撑的帕累托非劣解空间</strong> <KatexMath math="\mathcal{P}^*" />。让决策者清楚知晓：“若要提升 <KatexMath math="\Delta f_1 = +10\%" /> 运载能力，必须付出多少千克成本 <KatexMath math="\Delta f_2" /> 的代价”。
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-semibold text-slate-900 block mb-1">鲁棒性与敏感度检验：</span>
              <p className="text-slate-600">
                优秀的设计方案应在权重发生 <KatexMath math="\mathbf{w} \pm 15\%" /> 波动时依然保持在优选前列。通过 TOPSIS 欧氏距离与帕累托前沿双重校验，能够有效杜绝主观拍脑袋决策。
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              模块 10
            </span>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              系统权衡基本要素与四大核心切片导引 (Knowledge Slices)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            解构多属性权衡代数原理、帕累托前沿非劣优势与工程论证三大致命决策陷阱
          </p>
        </div>
      </div>

      {/* Slice Switcher Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {slices.map((s) => {
          const isActive = activeSlice === s.id;
          const Icon = s.icon;

          return (
            <button
              key={s.id}
              onClick={() => setActiveSlice(s.id)}
              className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                isActive
                  ? `${s.borderColor} ${s.bgColor} shadow-xs ring-1 ring-slate-300`
                  : 'border-slate-200/80 hover:bg-slate-50 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`p-1 rounded-md ${s.bgColor} ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-500">
                    {s.badge}
                  </span>
                </div>
                <div className="font-bold text-slate-800 text-xs line-clamp-1">{s.title}</div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 line-clamp-1">{s.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Active Slice Detailed Content */}
      <div className="p-4 bg-slate-50/50 border border-slate-200/70 rounded-xl mt-1">
        {slices.find((s) => s.id === activeSlice)?.content}
      </div>
    </div>
  );
};
