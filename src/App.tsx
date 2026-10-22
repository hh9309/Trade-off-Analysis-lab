import React, { useState, useMemo } from 'react';
import { CASE_STUDIES } from './data/cases';
import { CaseStudy, Criterion, Alternative, NormalizationMethod } from './types/tradeoff';
import { evaluateAlternatives, calculateEntropyWeights } from './utils/math';
import { CentralHeader } from './components/CentralHeader';
import { ModuleNav, ActiveModuleId } from './components/ModuleNav';
import { CaseSelector } from './components/CaseSelector';
import { WorkflowGuide, WorkflowStep } from './components/WorkflowGuide';
import { CriteriaTable } from './components/CriteriaTable';
import { AlternativesTable } from './components/AlternativesTable';
import { NormalizationView } from './components/NormalizationView';
import { ConstraintsModule } from './components/ConstraintsModule';
import { ParetoScatterPlot } from './components/ParetoScatterPlot';
import { RadarChart } from './components/RadarChart';
import { ParallelCoordinatesPlot } from './components/ParallelCoordinatesPlot';
import { TopsisRanking } from './components/TopsisRanking';
import { TradeoffAlgebra } from './components/TradeoffAlgebra';
import { PythonEngineView } from './components/PythonEngineView';
import { PythonEngineModal } from './components/PythonEngineModal';
import { AiDiagnosisView } from './components/AiDiagnosisView';
import { ExportView } from './components/ExportView';
import { ExportModal } from './components/ExportModal';
import { KnowledgeSlices } from './components/KnowledgeSlices';
import { AiAssistant } from './components/AiAssistant';
import {
  Crosshair,
  ShieldCheck,
  GitCommit,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';

import { ModelType } from './components/ModelSettingsModal';

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelType>('gemini-3.8-flash');
  const [activeModule, setActiveModule] = useState<ActiveModuleId>('overview');
  const [activeCase, setActiveCase] = useState<CaseStudy>(CASE_STUDIES[0]);
  const [criteria, setCriteria] = useState<Criterion[]>(CASE_STUDIES[0].criteria);
  const [alternatives, setAlternatives] = useState<Alternative[]>(CASE_STUDIES[0].alternatives);
  const [normMethod, setNormMethod] = useState<NormalizationMethod>('min-max');
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>(4);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | undefined>(
    CASE_STUDIES[0].recommendedAlternativeId
  );
  const [vizTab, setVizTab] = useState<'scatter' | 'radar' | 'parallel' | 'topsis'>('scatter');
  const [showPythonModal, setShowPythonModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  // When switching case study, re-load criteria & alternatives
  const handleSelectCase = (cs: CaseStudy) => {
    setActiveCase(cs);
    setCriteria(cs.criteria);
    setAlternatives(cs.alternatives);
    setSelectedAlternativeId(cs.recommendedAlternativeId);
  };

  // Real-time evaluation of all alternatives (feasibility, Pareto dominance, TOPSIS, WSM)
  const analysisResult = useMemo(() => {
    return evaluateAlternatives(alternatives, criteria, normMethod);
  }, [alternatives, criteria, normMethod]);

  // Apply Entropy Weights
  const handleApplyEntropyWeights = () => {
    const entropyWeights = calculateEntropyWeights(alternatives, criteria);
    setCriteria((prev) =>
      prev.map((c) => ({
        ...c,
        weight: entropyWeights[c.id] ?? c.weight,
      }))
    );
  };

  const feasibleCount = analysisResult.feasibleAlternatives.length;
  const paretoCount = analysisResult.paretoAlternatives.length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900 py-6 px-3 sm:px-6">
      {/* Central Interface Main Container */}
      <main className="max-w-7xl w-full mx-auto space-y-5">
        {/* =========================================================================
            CENTRAL HEADER: 系统方案权衡分析实验室 + 导出权衡白皮书 + AI 权衡随诊专家
        ========================================================================== */}
        <CentralHeader
          caseName={activeCase.name}
          category={activeCase.category}
          tagline={activeCase.tagline}
          feasibleCount={feasibleCount}
          paretoCount={paretoCount}
          totalCount={alternatives.length}
          onOpenExport={() => setShowExportModal(true)}
          onToggleAi={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
          isAiOpen={isAiAssistantOpen}
        />

        {/* Embedded Central AI Assistant Workspace */}
        {isAiAssistantOpen && (
          <AiAssistant
            caseName={activeCase.name}
            criteria={criteria}
            alternatives={analysisResult.allAlternatives}
            isOpen={isAiAssistantOpen}
            onClose={() => setIsAiAssistantOpen(false)}
            activeModel={activeModel}
            onChangeModel={setActiveModel}
          />
        )}

        {/* 10-Module Explicit Navigator */}
        <ModuleNav
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          feasibleCount={feasibleCount}
          paretoCount={paretoCount}
        />

        {/* =========================================================================
            MODULE-SPECIFIC OR FULL EXECUTIVE OVERVIEW RENDERING
        ========================================================================== */}

        {/* MODULE 01: 权衡代数与多目标决策建模 */}
        {activeModule === 'mod1_algebra' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 01：权衡代数与多目标决策建模</span>
            </div>
            <TradeoffAlgebra
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
            />
          </div>
        )}

        {/* MODULE 02: 候选方案与多属性评价指标定义 */}
        {activeModule === 'mod2_matrix' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 02：候选方案与多属性评价指标定义</span>
            </div>
            <CriteriaTable
              criteria={criteria}
              onChangeCriteria={setCriteria}
              onApplyEntropyWeights={handleApplyEntropyWeights}
            />
            <AlternativesTable
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
              onChangeAlternatives={setAlternatives}
              selectedAlternativeId={selectedAlternativeId}
              onSelectAlternative={setSelectedAlternativeId}
            />
            <NormalizationView
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
              normMethod={normMethod}
              onChangeNormMethod={setNormMethod}
              selectedAlternativeId={selectedAlternativeId}
              onSelectAlternative={setSelectedAlternativeId}
            />
          </div>
        )}

        {/* MODULE 03: 多目标优化与工程约束条件设置 */}
        {activeModule === 'mod3_constraints' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 03：多目标优化与工程约束条件设置</span>
            </div>
            <ConstraintsModule
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
              onChangeCriteria={setCriteria}
            />
          </div>
        )}

        {/* MODULE 04: 帕累托最优解与非劣解前沿识别 */}
        {activeModule === 'mod4_pareto' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 04：帕累托最优解与非劣解前沿识别与多维可视化</span>
            </div>

            {/* Sub-tabs for 4 visualizations */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                帕累托前沿多维观测视角切换：
              </span>

              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setVizTab('scatter')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    vizTab === 'scatter'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                  2D 帕累托散点前沿
                </button>
                <button
                  onClick={() => setVizTab('radar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    vizTab === 'radar'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  全属性雷达图
                </button>
                <button
                  onClick={() => setVizTab('parallel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    vizTab === 'parallel'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5 text-indigo-600" />
                  多维并行坐标图
                </button>
                <button
                  onClick={() => setVizTab('topsis')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    vizTab === 'topsis'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  TOPSIS 距离排位
                </button>
              </div>
            </div>

            {vizTab === 'scatter' && (
              <ParetoScatterPlot
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            )}
            {vizTab === 'radar' && (
              <RadarChart
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            )}
            {vizTab === 'parallel' && (
              <ParallelCoordinatesPlot
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            )}
            {vizTab === 'topsis' && (
              <TopsisRanking
                alternatives={analysisResult.allAlternatives}
                criteria={criteria}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
                recommendedAlternativeId={activeCase.recommendedAlternativeId}
                expertRecommendation={activeCase.expertRecommendation}
              />
            )}
          </div>
        )}

        {/* MODULE 05: 六大系统方案权衡实战案例库 */}
        {activeModule === 'mod5_cases' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 05：六大系统方案权衡实战案例库</span>
            </div>
            <CaseSelector
              activeCaseId={activeCase.id}
              onSelectCase={handleSelectCase}
            />
          </div>
        )}

        {/* MODULE 06: Python / NumPy 多目标优化引擎 */}
        {activeModule === 'mod6_python' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 06：Python / NumPy 多目标优化引擎</span>
            </div>
            <PythonEngineView
              caseName={activeCase.name}
              criteria={criteria}
              alternatives={alternatives}
            />
          </div>
        )}

        {/* MODULE 07: AI 诊断与大模型 Q&A 随诊 */}
        {activeModule === 'mod7_ai' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 07：AI 诊断与大模型 Q&A 随诊</span>
            </div>
            <AiDiagnosisView
              caseName={activeCase.name}
              category={activeCase.category}
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
            />
          </div>
        )}

        {/* MODULE 08: 全流程导引 (方案定义→矩阵归一化→帕累托计算→优选决策) */}
        {activeModule === 'mod8_workflow' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 08：全流程研制导引工作流</span>
            </div>

            <WorkflowGuide
              currentStep={workflowStep}
              onSelectStep={setWorkflowStep}
              showAllModules={false}
              onToggleShowAll={() => setActiveModule('overview')}
            />

            {/* Step Content */}
            {workflowStep === 1 && (
              <CriteriaTable
                criteria={criteria}
                onChangeCriteria={setCriteria}
                onApplyEntropyWeights={handleApplyEntropyWeights}
              />
            )}
            {workflowStep === 2 && (
              <AlternativesTable
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                onChangeAlternatives={setAlternatives}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            )}
            {workflowStep === 3 && (
              <NormalizationView
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                normMethod={normMethod}
                onChangeNormMethod={setNormMethod}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            )}
            {workflowStep === 4 && (
              <ParetoScatterPlot
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            )}
            {workflowStep === 5 && (
              <TopsisRanking
                alternatives={analysisResult.allAlternatives}
                criteria={criteria}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
                recommendedAlternativeId={activeCase.recommendedAlternativeId}
                expertRecommendation={activeCase.expertRecommendation}
              />
            )}
          </div>
        )}

        {/* MODULE 09: 数据集与分析报告导出引擎 */}
        {activeModule === 'mod9_export' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 09：数据集与分析报告导出引擎</span>
            </div>
            <ExportView
              caseName={activeCase.name}
              category={activeCase.category}
              background={activeCase.background}
              tradeoffDilemma={activeCase.tradeoffDilemma}
              expertRecommendation={activeCase.expertRecommendation}
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
            />
          </div>
        )}

        {/* MODULE 10: 系统权衡基本要素与多维切片知识导引 */}
        {activeModule === 'mod10_slices' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 pb-1">
              <span>模块导航</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-semibold text-slate-800">模块 10：系统权衡基本要素与四大核心切片知识导引</span>
            </div>
            <KnowledgeSlices />
          </div>
        )}

        {/* =========================================================================
            OVERVIEW: 全景综合决策大屏 (Executive Unified Workbench)
        ========================================================================== */}
        {activeModule === 'overview' && (
          <div className="space-y-6">
            {/* 1. Case background */}
            <CaseSelector
              activeCaseId={activeCase.id}
              onSelectCase={handleSelectCase}
            />

            {/* 2. Decision Matrix & Criteria */}
            <div className="grid grid-cols-1 gap-6">
              <CriteriaTable
                criteria={criteria}
                onChangeCriteria={setCriteria}
                onApplyEntropyWeights={handleApplyEntropyWeights}
              />
              <AlternativesTable
                criteria={criteria}
                alternatives={analysisResult.allAlternatives}
                onChangeAlternatives={setAlternatives}
                selectedAlternativeId={selectedAlternativeId}
                onSelectAlternative={setSelectedAlternativeId}
              />
            </div>

            {/* 3. Normalization Heatmap */}
            <NormalizationView
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
              normMethod={normMethod}
              onChangeNormMethod={setNormMethod}
              selectedAlternativeId={selectedAlternativeId}
              onSelectAlternative={setSelectedAlternativeId}
            />

            {/* 4. Pareto Multi-Attribute Visualization Lab */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600" />
                  帕累托多维可视化大屏观测视角：
                </span>

                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setVizTab('scatter')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      vizTab === 'scatter' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    2D 帕累托散点前沿
                  </button>
                  <button
                    onClick={() => setVizTab('radar')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      vizTab === 'radar' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    全属性雷达图
                  </button>
                  <button
                    onClick={() => setVizTab('parallel')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      vizTab === 'parallel' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    多维并行坐标图
                  </button>
                  <button
                    onClick={() => setVizTab('topsis')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      vizTab === 'topsis' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    TOPSIS 距离排位
                  </button>
                </div>

                <button
                  onClick={() => setActiveModule('mod6_python')}
                  className="text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  展开 Python 优化引擎 →
                </button>
              </div>

              {vizTab === 'scatter' && (
                <ParetoScatterPlot
                  criteria={criteria}
                  alternatives={analysisResult.allAlternatives}
                  selectedAlternativeId={selectedAlternativeId}
                  onSelectAlternative={setSelectedAlternativeId}
                />
              )}
              {vizTab === 'radar' && (
                <RadarChart
                  criteria={criteria}
                  alternatives={analysisResult.allAlternatives}
                  selectedAlternativeId={selectedAlternativeId}
                  onSelectAlternative={setSelectedAlternativeId}
                />
              )}
              {vizTab === 'parallel' && (
                <ParallelCoordinatesPlot
                  criteria={criteria}
                  alternatives={analysisResult.allAlternatives}
                  selectedAlternativeId={selectedAlternativeId}
                  onSelectAlternative={setSelectedAlternativeId}
                />
              )}
              {vizTab === 'topsis' && (
                <TopsisRanking
                  alternatives={analysisResult.allAlternatives}
                  criteria={criteria}
                  selectedAlternativeId={selectedAlternativeId}
                  onSelectAlternative={setSelectedAlternativeId}
                  recommendedAlternativeId={activeCase.recommendedAlternativeId}
                  expertRecommendation={activeCase.expertRecommendation}
                />
              )}
            </div>

            {/* 5. Constraints module */}
            <ConstraintsModule
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
              onChangeCriteria={setCriteria}
            />

            {/* 6. Algebra and Slices */}
            <TradeoffAlgebra
              criteria={criteria}
              alternatives={analysisResult.allAlternatives}
            />

            <KnowledgeSlices />
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white rounded-xl p-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span>系统方案权衡分析 WebApp 实验室 · 严格十模块系统工程决策架构</span>
            <div className="flex items-center gap-4 text-slate-400">
              <span>01 权衡代数</span>
              <span>·</span>
              <span>04 帕累托前沿</span>
              <span>·</span>
              <span>06 NumPy引擎</span>
              <span>·</span>
              <span>07 AI随诊</span>
              <span>·</span>
              <span>09 报告导出</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Popups & Modals */}
      {showPythonModal && (
        <PythonEngineModal
          caseName={activeCase.name}
          criteria={criteria}
          alternatives={alternatives}
          onClose={() => setShowPythonModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          caseName={activeCase.name}
          category={activeCase.category}
          background={activeCase.background}
          tradeoffDilemma={activeCase.tradeoffDilemma}
          expertRecommendation={activeCase.expertRecommendation}
          criteria={criteria}
          alternatives={analysisResult.allAlternatives}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
