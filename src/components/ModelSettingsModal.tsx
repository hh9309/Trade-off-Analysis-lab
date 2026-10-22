import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Check,
  ShieldCheck,
  Sparkles,
  Cpu,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ModelType,
  getStoredApiKey,
  setStoredApiKey,
  setStoredModel,
} from '../utils/aiService';

export type { ModelType };

interface Props {
  currentModel: ModelType;
  onConfirmModel: (model: ModelType, apiKey: string) => void;
  onClose: () => void;
}

export const ModelSettingsModal: React.FC<Props> = ({
  currentModel,
  onConfirmModel,
  onClose,
}) => {
  const [selectedModel, setSelectedModel] = useState<ModelType>(currentModel);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successSaved, setSuccessSaved] = useState<boolean>(false);

  // Load existing key from localStorage whenever selectedModel changes
  useEffect(() => {
    const existing = getStoredApiKey(selectedModel);
    setApiKeyInput(existing);
    setErrorMessage('');
  }, [selectedModel]);

  const handleSelectModel = (model: ModelType) => {
    setSelectedModel(model);
    setErrorMessage('');
  };

  const handleConfirm = () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setErrorMessage(
        `必须手工输入 ${selectedModel === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash'} 的 API-Key 才能确认大模型！`
      );
      return;
    }

    if (trimmed.length < 8) {
      setErrorMessage('输入的 API-Key 长度过短，请检查是否完整粘贴。');
      return;
    }

    // Persist to localStorage
    setStoredApiKey(selectedModel, trimmed);
    setStoredModel(selectedModel);

    setSuccessSaved(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });

    setTimeout(() => {
      onConfirmModel(selectedModel, trimmed);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                大模型提供商与 API-Key 随诊配置
              </h3>
              <p className="text-xs text-slate-500">
                1 手工输入 API-Key · 2 选择两个大模型 · 3 确认大模型（支持 GitHub 部署浏览器直连）
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Step 2: 选择两个大模型 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 block text-xs">
                第一步：选择目标大模型 (Select Model)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">双模型架构</span>
            </div>

            {/* Option 1: gemini 3 flash */}
            <div
              onClick={() => handleSelectModel('gemini-3.8-flash')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'border-sky-500 bg-sky-50/50 shadow-xs ring-1 ring-sky-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-lg shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span>gemini 3 flash</span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-mono font-medium">
                      Google 旗舰推荐
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                    极速运筹推理架构，针对工程硬约束过严诊断、帕累托前沿折中与综合指标敏感度分析具有卓越响应速度与严谨度。
                  </p>
                </div>
              </div>
              {selectedModel === 'gemini-3.8-flash' && (
                <Check className="w-4 h-4 text-sky-600 shrink-0 mt-1" />
              )}
            </div>

            {/* Option 2: deepseek-v4-pro */}
            <div
              onClick={() => handleSelectModel('deepseek-v4-pro')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                selectedModel === 'deepseek-v4-pro'
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <span>deepseek-v4-pro</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono font-medium">
                      深度推理 Reasoner
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                    深度长思维链模型，擅长高维多目标不可行约束溯源、加权平均掩盖一票否决指标的死锁破局与专家折中建议。
                  </p>
                </div>
              </div>
              {selectedModel === 'deepseek-v4-pro' && (
                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />
              )}
            </div>
          </div>

          {/* Step 1: 手工输入 API-Key 输入框 */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>第二步：手工输入 API-Key</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                当前对应：{selectedModel === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash'}
              </span>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setErrorMessage('');
                }}
                placeholder={
                  selectedModel === 'deepseek-v4-pro'
                    ? '请输入 DeepSeek API-Key（通常以 sk- 开头）'
                    : '请输入 Google Gemini API-Key（通常以 AIzaSy 开头）'
                }
                className={`w-full pl-3 pr-20 py-2.5 rounded-xl border text-xs font-mono transition-colors focus:outline-none ${
                  errorMessage
                    ? 'border-rose-400 bg-rose-50/30 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-300 bg-slate-50/50 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500'
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={() => setApiKeyInput('')}
                    className="p-1 text-slate-400 hover:text-slate-600 text-[10px]"
                    title="清空"
                  >
                    清空
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={showKey ? '隐藏密钥' : '显示密钥'}
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>* 所有大模型调用必须输入 API-Key 后方可调用。</span>
              {selectedModel === 'deepseek-v4-pro' ? (
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline flex items-center gap-0.5 font-sans"
                >
                  获取 DeepSeek 密钥 <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline flex items-center gap-0.5 font-sans"
                >
                  获取 Gemini 密钥 <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* GitHub Deployment & Browser Calling Information */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>GitHub 部署与纯浏览器前端直连调用设计</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              本项目专为开源部署至 <strong>GitHub / GitHub Pages</strong> 优化，由浏览器直接安全请求大模型服务，无需自行维护中转后端。输入的 API-Key 仅存储于当前浏览器本地缓存（<code className="text-slate-800 font-mono">localStorage</code>），刷新不会丢失，绝不泄漏至代码仓库。
            </p>
          </div>
        </div>

        {/* Footer: Confirm Model Button */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[11px] font-mono text-slate-400">
            {apiKeyInput.trim() ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                密钥已键入待确认
              </span>
            ) : (
              <span className="text-rose-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                未输入 API-Key（禁止调用）
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {successSaved ? '已保存！' : '确认大模型'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
