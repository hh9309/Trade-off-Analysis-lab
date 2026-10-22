import React, { useState, useEffect } from 'react';
import { Criterion, EvaluatedAlternative } from '../types/tradeoff';
import {
  Bot,
  Send,
  Sparkles,
  X,
  RefreshCw,
  Settings,
  Key,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { ModelSettingsModal } from './ModelSettingsModal';
import {
  ModelType,
  getStoredModel,
  setStoredModel,
  hasApiKey,
  executeAiDiagnose,
  executeAiChat,
} from '../utils/aiService';

interface Props {
  caseName: string;
  category?: string;
  criteria: Criterion[];
  alternatives: EvaluatedAlternative[];
  isOpen: boolean;
  onClose: () => void;
  activeModel?: ModelType;
  onChangeModel?: (model: ModelType) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistant: React.FC<Props> = ({
  caseName,
  category = '系统工程',
  criteria,
  alternatives,
  isOpen,
  onClose,
  activeModel: initialModel,
  onChangeModel,
}) => {
  const [currentModel, setCurrentModel] = useState<ModelType>(initialModel || getStoredModel());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [keyConfigured, setKeyConfigured] = useState<boolean>(hasApiKey(currentModel));
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '您好！我是系统工程权衡分析（Trade Study）AI 随诊专家。已接入当前中央决策矩阵。\n\n⚠️ 重要提示：本项目设计为前端浏览器直接调用，所有大模型调用必须手工输入 API-Key 后方可调用。请点击右上方【设置大模型】齿轮图标，手工输入您的 API-Key，选择 gemini 3 flash 或 deepseek-v4-pro，并点击“确认大模型”。',
    },
  ]);

  useEffect(() => {
    setKeyConfigured(hasApiKey(currentModel));
  }, [currentModel]);

  const feasibleCount = alternatives.filter((a) => a.isFeasible).length;
  const paretoCount = alternatives.filter((a) => a.isPareto).length;
  const modelDisplayName = currentModel === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash';

  const handleConfirmModel = (model: ModelType, apiKey: string) => {
    setCurrentModel(model);
    setStoredModel(model);
    setKeyConfigured(true);
    if (onChangeModel) onChangeModel(model);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `⚙️ 大模型已切换并确认：【${model === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash'}】。API-Key 校验通过，后续随诊与咨询将直接由浏览器向模型发起安全调用。`,
      },
    ]);
  };

  const handleRunDiagnosis = async () => {
    // 严格校验：所有大模型调用必须输入 API-Key 后才能调用
    if (!hasApiKey(currentModel)) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ 无法发起调用：所有大模型调用必须先手工输入 API-Key！请点击右上角【设置大模型】输入并确认。',
        },
      ]);
      setShowSettingsModal(true);
      return;
    }

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `【一键全维系统体检】（使用 ${modelDisplayName}）：请针对当前决策矩阵进行深度风险诊断与帕累托折中建议。`,
      },
    ]);

    try {
      const output = await executeAiDiagnose({
        caseName,
        category,
        criteria,
        alternatives,
        feasibleCount,
        paretoCount,
        model: currentModel,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: output,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ 诊断请求受阻：${err.message || '网络连接或接口异常'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (userText?: string) => {
    const textToSend = userText || inputMessage;
    if (!textToSend.trim() || loading) return;

    // 严格校验：所有大模型调用必须输入 API-Key 后才能调用
    if (!hasApiKey(currentModel)) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ 无法发起提问：所有大模型调用必须输入 API-Key 后才能调用！请点击右上角【设置大模型】输入您的密钥。',
        },
      ]);
      setShowSettingsModal(true);
      return;
    }

    setInputMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: textToSend }]);
    setLoading(true);

    try {
      const contextSummary = `当前案例: ${caseName}, 指标数: ${criteria.length}, 可行方案数: ${feasibleCount}, 帕累托解数: ${paretoCount}`;
      const output = await executeAiChat({
        message: textToSend,
        context: contextSummary,
        model: currentModel,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: output },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ 回复失败: ${err.message || '未知错误'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    '为什么加权平均法经常掩盖致命缺陷？',
    '当硬约束过严导致可行域为空时，如何科学放宽？',
    '如何向型号总师汇报帕累托前沿折中方案？',
    '请对比 TOPSIS 与加权求和（WSM）的优劣。',
  ];

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-sky-400 shadow-lg flex flex-col overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
            <Bot className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">AI 权衡随诊专家工作舱</span>
              <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800 px-1.5 py-0.2 rounded">
                {modelDisplayName}
              </span>
              {keyConfigured ? (
                <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-1.5 py-0.2 rounded font-mono">
                  ● Key已配置
                </span>
              ) : (
                <span className="text-[10px] bg-rose-900/60 text-rose-300 border border-rose-700 px-1.5 py-0.2 rounded font-mono">
                  ○ 未输入Key
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              已接入决策矩阵 · 纯浏览器前端直连（部署 GitHub 支持）
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Gear Icon to Configure Model & Enter API-Key */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-[11px] font-medium transition-colors border border-slate-700"
            title="手工输入 API-Key，选择与确认大模型"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>设置大模型</span>
          </button>

          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors ml-1"
            title="收起随诊舱"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mandatory API-Key Missing Notice inside Workspace if key is absent */}
      {!keyConfigured && (
        <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>未检测到有效 API-Key</strong>：所有大模型调用必须输入 API-Key 后方可调用！
            </span>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-[11px] text-rose-700 font-bold underline hover:text-rose-900"
          >
            点击输入并确认 API-Key
          </button>
        </div>
      )}

      {/* Quick Action Bar */}
      <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
          <span>模型: <strong className="text-slate-900">{modelDisplayName}</strong></span>
          <span>·</span>
          <span>方案池: {alternatives.length}</span>
          <span>·</span>
          <span>可行解: <strong className="text-emerald-600">{feasibleCount}</strong></span>
          <span>·</span>
          <span>帕累托最优: <strong className="text-sky-600">{paretoCount}</strong></span>
        </div>

        <button
          onClick={handleRunDiagnosis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {loading ? 'AI 正在深入推理诊断中...' : '一键全维系统体检诊断'}
        </button>
      </div>

      {/* Chat Messages */}
      <div className="p-5 max-h-[380px] overflow-y-auto space-y-3 text-xs bg-slate-50/40">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-xs shadow-xs'
                  : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/90 shadow-2xs font-mono text-xs'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-600 p-3 rounded-xl text-xs flex items-center gap-2 border border-slate-200 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
              正在通过浏览器调用 {modelDisplayName} 推演权衡空间与支配边界...
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] bg-white">
        <span className="text-slate-400 shrink-0">快捷追问:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 border-t border-slate-100 flex items-center gap-2 bg-white"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            keyConfigured
              ? `向 ${modelDisplayName} 咨询当前系统指标冲突、TOPSIS排位或硬约束折中建议...`
              : '⚠️ 请先点击右上角“设置大模型”输入 API-Key 后方可提问...'
          }
          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="flex items-center gap-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 text-xs font-semibold"
        >
          <Send className="w-3.5 h-3.5" />
          发送
        </button>
      </form>

      {/* Settings Modal */}
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
