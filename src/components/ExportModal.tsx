import React, { useState, useMemo } from 'react';
import { Criterion, EvaluatedAlternative, CaseStudy } from '../types/tradeoff';
import { CASE_STUDIES } from '../data/cases';
import { generateCaseRawCsv, generateWorkflowWhitepaper } from '../utils/exportHelpers';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  X,
  FileSpreadsheet,
  Eye,
  Archive,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  caseName: string;
  category: string;
  background: string;
  tradeoffDilemma: string;
  expertRecommendation: string;
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({
  caseName,
  category,
  background,
  tradeoffDilemma,
  expertRecommendation,
  criteria,
  alternatives,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'csv' | 'casesHub'>('preview');
  const [copied, setCopied] = useState(false);

  // Generate 6-part workflow structured whitepaper
  const markdownContent = useMemo(() => {
    return generateWorkflowWhitepaper(
      caseName,
      category,
      background,
      tradeoffDilemma,
      expertRecommendation,
      criteria,
      alternatives
    );
  }, [caseName, category, background, tradeoffDilemma, expertRecommendation, criteria, alternatives]);

  // Current case CSV
  const csvContent = useMemo(() => {
    const activeCase = CASE_STUDIES.find((c) => c.name === caseName) || CASE_STUDIES[0];
    return generateCaseRawCsv(activeCase);
  }, [caseName]);

  const handleCopy = () => {
    const text = activeTab === 'csv' ? csvContent : markdownContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isCsv = activeTab === 'csv';
    const text = isCsv ? csvContent : markdownContent;
    const mime = isCsv ? 'text/csv;charset=utf-8;' : 'text/markdown;charset=utf-8;';
    const ext = isCsv ? 'csv' : 'md';

    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade_study_report_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
  };

  const handleDownloadSpecificCaseCsv = (cs: CaseStudy) => {
    const csvStr = generateCaseRawCsv(cs);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cs.id}_raw_dataset.csv`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
  };

  const handleDownloadAllCasesBundle = () => {
    const combined = CASE_STUDIES.map((cs) => {
      return `========================================================================\n# 案例: ${cs.name} (${cs.category})\n========================================================================\n${generateCaseRawCsv(cs)}\n\n`;
    }).join('\n');

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `six_system_cases_raw_datasets_bundle.txt`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
  };

  const feasible = alternatives.filter((a) => a.isFeasible);
  const pareto = alternatives.filter((a) => a.isPareto);
  const bestTopsis = [...feasible].sort((a, b) => b.topsisCloseness - a.topsisCloseness)[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                  模块 09
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  系统工程权衡分析白皮书与数据集导出
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                按全流程导引 6 大部分结构化组织，支持白皮书预览、Markdown / CSV 导出与六大案例原始数据下载
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制内容'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              下载当前报告
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              打印/保存PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between px-6 pt-2.5 border-b border-slate-100 bg-white text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2 px-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-emerald-600 text-emerald-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              白皮书排版预览 (6大部分)
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`pb-2 px-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'markdown'
                  ? 'border-emerald-600 text-emerald-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown 白皮书源码
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`pb-2 px-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'csv'
                  ? 'border-emerald-600 text-emerald-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              当前案例 CSV 数据
            </button>
            <button
              onClick={() => setActiveTab('casesHub')}
              className={`pb-2 px-2 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'casesHub'
                  ? 'border-sky-600 text-sky-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-sky-600" />
              六大案例原始数据下载区
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            全流程导引 1~5 步闭环组织
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white space-y-7 shadow-xs">
              {/* Cover Header */}
              <div className="pb-5 border-b-2 border-slate-900 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="tracking-widest uppercase">System Trade Study Report · Systems Engineering Standard</span>
                  <span>{new Date().toLocaleDateString('zh-CN')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  系统工程方案权衡分析白皮书
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">课题: {caseName}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-mono">领域: {category}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">
                    Pareto Frontier & TOPSIS 优化认证
                  </span>
                </div>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-l-2 border-slate-900 pl-2">
                  第一部分：工程课题背景与权衡两难博弈 (Executive Summary)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{background}</p>
                <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-lg text-xs text-rose-950">
                  <strong>核心权衡两难冲突 (Trade-off Dilemma)：</strong> {tradeoffDilemma}
                </div>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-l-2 border-sky-600 pl-2">
                  第二部分：评价准则体系定义与主客观赋权 (Step 1: Criteria & Weights)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700 font-semibold">
                      <tr className="border-b border-slate-200">
                        <th className="p-2">代码</th>
                        <th className="p-2">准则名称</th>
                        <th className="p-2">物理单位</th>
                        <th className="p-2">优化方向</th>
                        <th className="p-2">权重</th>
                        <th className="p-2">硬约束区间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {criteria.map((c) => (
                        <tr key={c.id}>
                          <td className="p-2 font-bold">{c.code}</td>
                          <td className="p-2 font-sans">{c.name}</td>
                          <td className="p-2 text-slate-500">{c.unit}</td>
                          <td className="p-2">
                            {c.direction === 'max' ? (
                              <span className="text-emerald-700 font-sans font-medium">↑ 极大化</span>
                            ) : (
                              <span className="text-indigo-700 font-sans font-medium">↓ 极小化</span>
                            )}
                          </td>
                          <td className="p-2 font-bold">{(c.weight * 100).toFixed(1)}%</td>
                          <td className="p-2 text-slate-600">
                            {c.constraintMin ?? '-'} ~ {c.constraintMax ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-l-2 border-sky-600 pl-2">
                  第三部分：候选方案数据矩阵录入与硬极限约束 (Step 2: Alternatives & Hard Limits)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 text-slate-700 font-semibold">
                      <tr className="border-b border-slate-200">
                        <th className="p-2">代码</th>
                        <th className="p-2">方案名称</th>
                        <th className="p-2 text-center">可行性审核</th>
                        {criteria.map((c) => (
                          <th key={c.id} className="p-2 text-right">{c.code}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {alternatives.map((a) => (
                        <tr key={a.id} className={a.isFeasible ? '' : 'bg-rose-50/30'}>
                          <td className="p-2 font-bold">{a.code}</td>
                          <td className="p-2 font-sans font-medium">{a.name}</td>
                          <td className="p-2 text-center">
                            {a.isFeasible ? (
                              <span className="text-emerald-700 font-sans font-semibold">✅ 满足硬约束</span>
                            ) : (
                              <span className="text-rose-700 font-sans font-semibold">
                                ❌ 违规淘汰
                              </span>
                            )}
                          </td>
                          {criteria.map((c) => (
                            <td key={c.id} className="p-2 text-right">{a.values[c.id]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-l-2 border-teal-600 pl-2">
                  第四部分：多维异构属性无量纲化映射 (Step 3: Dimensionality Normalization)
                </h3>
                <p className="text-xs text-slate-600">
                  采用极差规范化映射至 [0, 1] 标量空间，并计算综合加权和（WSM）：
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 font-mono text-[11px]">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr className="border-b border-slate-200">
                        <th className="p-2">方案</th>
                        {criteria.map((c) => (
                          <th key={c.id} className="p-2 text-right">{c.code} (Norm)</th>
                        ))}
                        <th className="p-2 text-right font-bold text-emerald-800">WSM 得分</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {alternatives.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2 font-bold">{a.code}</td>
                          {criteria.map((c) => (
                            <td key={c.id} className="p-2 text-right text-slate-700">
                              {(a.normalizedValues[c.id] ?? 0).toFixed(3)}
                            </td>
                          ))}
                          <td className="p-2 text-right font-bold text-emerald-700 bg-emerald-50/40">
                            {(a.wsmScore * 100).toFixed(1)}分
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-l-2 border-emerald-600 pl-2">
                  第五部分：帕累托非劣前沿求解与可行解集识别 (Step 4: Pareto Frontier)
                </h3>
                <p className="text-xs text-slate-600">
                  严格滤除受支配劣解，当前共识别出 <strong>{pareto.length} 个互不支配的帕累托有效前沿方案</strong>：
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {pareto.map((p) => (
                    <div key={p.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs">
                      <div className="flex items-center justify-between font-bold text-emerald-950 mb-1">
                        <span>★ [{p.code}] {p.name}</span>
                        <span className="font-mono text-emerald-700">Pareto Rank 1</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        相对贴近度: <strong className="font-mono">{p.topsisCloseness.toFixed(4)}</strong> · 支配了 {p.dominates.length} 个备选方案
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6 */}
              <div className="space-y-2.5 pt-1">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-l-2 border-amber-500 pl-2">
                  第六部分：TOPSIS欧氏几何排位与总体推荐决策 (Step 5: TOPSIS & Decision Rationale)
                </h3>
                {bestTopsis && (
                  <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span className="text-xs text-amber-300 font-mono font-bold uppercase tracking-wider">
                        型号论证委员会基线推荐方案
                      </span>
                    </div>
                    <div className="text-base font-black">
                      [{bestTopsis.code}] {bestTopsis.name}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed font-sans">
                      {expertRecommendation}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-amber-300/90 pt-1">
                      <span>TOPSIS 贴近度: {bestTopsis.topsisCloseness.toFixed(4)}</span>
                      <span>·</span>
                      <span>距正理想解 D⁺: {bestTopsis.dPlus.toFixed(4)}</span>
                      <span>·</span>
                      <span>距负理想解 D⁻: {bestTopsis.dMinus.toFixed(4)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MARKDOWN */}
          {activeTab === 'markdown' && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200 leading-relaxed">
                {markdownContent}
              </pre>
            </div>
          )}

          {/* TAB 3: CSV */}
          {activeTab === 'csv' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 overflow-x-auto shadow-xs">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800 leading-relaxed">
                {csvContent}
              </pre>
            </div>
          )}

          {/* TAB 4: CASES HUB */}
          {activeTab === 'casesHub' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between p-3.5 bg-sky-50 border border-sky-200 rounded-xl gap-3">
                <div>
                  <span className="font-bold text-sky-900 text-xs block">六大系统工程案例原始数据集下载区</span>
                  <p className="text-[11px] text-sky-700 mt-0.5">
                    包含航天运载、智能电动汽车、空天测控、智慧城市、绿色算力与特种无人装备全部 6 套未加工真实工程数据矩阵与硬约束定义
                  </p>
                </div>
                <button
                  onClick={handleDownloadAllCasesBundle}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  打包下载全部 6 大案例原始数据
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {CASE_STUDIES.map((cs, i) => (
                  <div
                    key={cs.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                        <span>案例 0{i + 1}</span>
                        <span className="text-slate-500 font-medium">{cs.category}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mb-1">{cs.name}</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                        {cs.tradeoffDilemma}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-400">
                        <span>评价准则: {cs.criteria.length} 项</span>
                        <span>·</span>
                        <span>候选方案: {cs.alternatives.length} 个</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">Format: CSV</span>
                      <button
                        onClick={() => handleDownloadSpecificCaseCsv(cs)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-medium transition-colors"
                      >
                        <Download className="w-3 h-3 text-sky-600" />
                        下载该案例原始CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
