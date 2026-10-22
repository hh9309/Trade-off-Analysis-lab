import React, { useState, useEffect } from 'react';
import { Criterion, EvaluatedAlternative } from '../types/tradeoff';
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Settings,
  Key,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { ModelSettingsModal } from './ModelSettingsModal';
import {
  ModelType,
  getStoredModel,
  setStoredModel,
  hasApiKey,
  getStoredApiKey,
  executeAiDiagnose,
  executeAiChat,
} from '../utils/aiService';

interface Props {
  caseName: string;
  category: string;
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
}

export const AiDiagnosisView: React.FC<Props> = ({
  caseName,
  category,
  criteria,
  alternatives,
}) => {
  const [currentModel, setCurrentModel] = useState<ModelType>(getStoredModel());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [keyConfigured, setKeyConfigured] = useState<boolean>(hasApiKey(currentModel));
  const [authWarning, setAuthWarning] = useState<string>('');

  useEffect(() => {
    setKeyConfigured(hasApiKey(currentModel));
  }, [currentModel]);

  const feasible = alternatives.filter((a) => a.isFeasible);
  const pareto = alternatives.filter((a) => a.isPareto);
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const handleConfirmModel = (model: ModelType, apiKey: string) => {
    setCurrentModel(model);
    setStoredModel(model);
    setKeyConfigured(true);
    setAuthWarning('');
    setReport(null); // Clear previous report so user can regenerate with the new model & key
  };

  // Trigger Gemini/DeepSeek AI Diagnosis
  const handleTriggerDiagnosis = async () => {
    // 严格校验：所有大模型调用必须输入 API-Key 后才能调用
    if (!hasApiKey(currentModel)) {
      setAuthWarning('所有大模型调用必须输入 API-Key 后方可调用！请点击下方齿轮设置手工输入您的 API-Key 并确认大模型。');
      setShowSettingsModal(true);
      return;
    }

    setAuthWarning('');
    setLoading(true);
    try {
      const output = await executeAiDiagnose({
        caseName,
        category,
        criteria,
        alternatives,
        feasibleCount: feasible.length,
        paretoCount: pareto.length,
        model: currentModel,
      });
      setReport(output);
    } catch (err: any) {
      setReport(`⚠️ 诊断受阻：${err.message || '网络连接或接口异常'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async (presetText?: string) => {
    const q = presetText || chatInput;
    if (!q.trim() || loading) return;

    // 严格校验：所有大模型调用必须输入 API-Key 后才能调用
    if (!hasApiKey(currentModel)) {
      setAuthWarning('所有大模型调用必须输入 API-Key 后方可调用！请先设置并确认您的 API-Key。');
      setShowSettingsModal(true);
      return;
    }

    setAuthWarning('');
    setChatInput('');
    setChatHistory((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const output = await executeAiChat({
        message: q,
        context: `课题: ${caseName}, 指标: ${criteria.map((c) => c.name).join(', ')}, 帕累托方案数: ${pareto.length}`,
        model: currentModel,
      });
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: output },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ 请求失败: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const modelDisplayName = currentModel === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash';

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              模块 07
            </span>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-sky-600" />
              AI 诊断与大模型 Q&A 随诊 (AI Trade-off Diagnosis & Engineering Q&A)
            </h3>
            <span className="text-[11px] font-mono bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-medium">
              当前大模型: {modelDisplayName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            动态诊断指标权重设定主观矛盾、约束条件过严导致帕累托前沿解集为空及权衡盲区风险
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Gear icon button to manually enter API-Key and select/confirm model */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200"
            title="手工输入 API-Key，选择与确认大模型"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>设置大模型</span>
          </button>

          <button
            onClick={handleTriggerDiagnosis}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            )}
            {loading ? 'AI 正在推理中...' : `生成 ${modelDisplayName} 诊断报告`}
          </button>
        </div>
      </div>

      {/* Mandatory API-Key Status Notification Strip */}
      {keyConfigured ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              已完成 API-Key 手工设置：当前生效大模型为 <strong>{modelDisplayName}</strong>，支持纯浏览器直连调用。
            </span>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-[11px] text-emerald-700 underline hover:text-emerald-900 font-medium"
          >
            更换密钥或切换模型
          </button>
        </div>
      ) : (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-rose-950">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold block">尚未设置 API-Key（所有大模型调用必须输入 API-Key 后方可调用）</span>
              <span className="text-[11px] text-rose-700">
                本项目已适配 GitHub 部署纯浏览器调用架构。请先手工输入您的 API-Key，选择 gemini 3 flash 或 deepseek-v4-pro，并点击“确认大模型”。
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs shrink-0"
          >
            <Key className="w-3.5 h-3.5" />
            立即输入 API-Key 并确认
          </button>
        </div>
      )}

      {authWarning && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{authWarning}</span>
        </div>
      )}

      {/* 3 Quick Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>可行空间健康度</span>
            <span
              className={`font-mono text-[11px] font-bold ${
                feasible.length > 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {feasible.length} / {alternatives.length} 可行
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {feasible.length === 0
              ? '⚠️ 危险：硬约束条件过严，可行解空间完全塌缩为空集！请立即放宽极限边界。'
              : feasible.length < alternatives.length / 2
              ? '💡 提示：半数以上方案被硬约束淘汰，建议复核是否设立了过高的单项门槛。'
              : '✅ 健康：可行解空间充裕，支撑后续高维帕累托筛选。'}
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>权重分配均衡度</span>
            <span className="font-mono text-[11px] font-bold text-sky-600">
              ∑ w = {(totalWeight * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {Math.max(...criteria.map((c) => c.weight)) >= 0.5
              ? '⚠️ 警告：单一指标权重超过 50%，可能导致多目标权衡退化为单一指标排优，忽视其他关键代价。'
              : '✅ 权重分配相对均衡，各关键工程维度具备足够的表决博弈空间。'}
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>帕累托前沿丰度</span>
            <span className="font-mono text-[11px] font-bold text-indigo-600">
              {pareto.length} 个非劣解
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {pareto.length <= 1
              ? '💡 前沿仅有单一解或为空，说明方案在核心维度上形成了断层式绝对碾压，缺乏权衡博弈。'
              : `✅ 存在 ${pareto.length} 个互不支配的前沿方案，为型号总师提供了充分的性能与代价折中选择。`}
          </p>
        </div>
      </div>

      {/* Detailed AI Report Screen */}
      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            AI 专家系统深度诊断评估意见书
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Engine: {modelDisplayName}
          </span>
        </div>

        {report ? (
          <div className="p-4 bg-white rounded-lg border border-slate-200/80 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
            {report}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
            暂未生成报告。请确保已在「设置大模型」中手工输入 API-Key 并确认，随后点击右上角按钮生成深度诊断。
          </div>
        )}
      </div>

      {/* Interactive Q&A Console */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
        <span className="text-xs font-bold text-slate-800">
          向复杂系统权衡分析 AI 专家随诊追问
        </span>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            '如何判定指标间是否存在多重共线性导致的权重失真？',
            '当帕累托前沿解集过少时，应优先放宽哪项硬指标？',
            '如何向型号评审专家解释被支配解虽然综合分高但也必须被淘汰？',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendChat(prompt)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-lg text-xs">
            {chatHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg leading-relaxed ${
                  item.role === 'user'
                    ? 'bg-sky-50 text-sky-900 border border-sky-100 font-semibold'
                    : 'bg-white text-slate-800 border border-slate-200'
                }`}
              >
                <div className="text-[10px] text-slate-400 mb-1">
                  {item.role === 'user' ? '我的提问' : `AI 专家 (${modelDisplayName}) 回复`}
                </div>
                <div className="whitespace-pre-wrap">{item.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChat();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`向 ${modelDisplayName} 咨询多目标权衡或工程折中建议（必须已输入 API-Key）...`}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !chatInput.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            发送提问
          </button>
        </form>
      </div>

      {/* Model Settings Modal */}
      {showSettingsModal && (
        <ModelSettingsModal
          currentModel={currentModel}
          onConfirmModel={handleConfirmModel}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
