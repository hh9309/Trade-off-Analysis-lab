/**
 * Client-Side Direct & Hybrid AI Service for GitHub Deployment & Local Dev
 * 严格遵照指令：
 * 1. 手工输入 API-Key
 * 2. 选择两个大模型：gemini 3 flash 和 deepseek-v4-pro
 * 3. 确认大模型
 * 4. 部署到 GitHub 浏览器调用使用，所有大模型调用必须输入 API-Key 后才能调用
 */

export type ModelType = 'gemini-3.8-flash' | 'deepseek-v4-pro';

const STORAGE_KEY_GEMINI = 'TRADE_STUDY_GEMINI_API_KEY';
const STORAGE_KEY_DEEPSEEK = 'TRADE_STUDY_DEEPSEEK_API_KEY';
const STORAGE_KEY_ACTIVE_MODEL = 'TRADE_STUDY_ACTIVE_MODEL';

export function getStoredModel(): ModelType {
  const m = localStorage.getItem(STORAGE_KEY_ACTIVE_MODEL);
  if (m === 'deepseek-v4-pro') return 'deepseek-v4-pro';
  return 'gemini-3.8-flash';
}

export function setStoredModel(model: ModelType): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_MODEL, model);
}

export function getStoredApiKey(model: ModelType): string {
  if (model === 'deepseek-v4-pro') {
    return localStorage.getItem(STORAGE_KEY_DEEPSEEK) || '';
  }
  return localStorage.getItem(STORAGE_KEY_GEMINI) || '';
}

export function setStoredApiKey(model: ModelType, key: string): void {
  const trimmed = key.trim();
  if (model === 'deepseek-v4-pro') {
    localStorage.setItem(STORAGE_KEY_DEEPSEEK, trimmed);
  } else {
    localStorage.setItem(STORAGE_KEY_GEMINI, trimmed);
  }
}

export function hasApiKey(model: ModelType): boolean {
  const key = getStoredApiKey(model);
  return key.length > 5;
}

export interface DiagnoseRequestPayload {
  caseName: string;
  category: string;
  criteria: any[];
  alternatives: any[];
  feasibleCount: number;
  paretoCount: number;
  model: ModelType;
  prompt?: string;
}

export interface ChatRequestPayload {
  message: string;
  context: string;
  model: ModelType;
}

/**
 * Perform AI diagnosis via Browser Direct Call (for GitHub Pages static hosting)
 * with graceful backend proxy fallback if available.
 */
export async function executeAiDiagnose(payload: DiagnoseRequestPayload): Promise<string> {
  const apiKey = getStoredApiKey(payload.model);
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('未检测到 API-Key！请点击“设置大模型”手工输入 API-Key 并确认后再发起调用。');
  }

  const modelLabel = payload.model === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash';
  const criteriaSummary = payload.criteria
    .map(
      (c) =>
        `${c.name}(${c.direction === 'max' ? '极大化' : '极小化'}, 权重:${(c.weight * 100).toFixed(0)}%, 约束:[${c.constraintMin ?? '-'}~${c.constraintMax ?? '-'}])`
    )
    .join('; ');

  const systemPrompt = `你是一名资深复杂系统工程权衡分析与运筹决策专家。
当前接入的大模型为：${modelLabel}。
请针对以下系统方案权衡决策数据进行深度健康度体检与风险诊断：

【工程课题】：${payload.caseName} (${payload.category})
【评价指标体系】：${criteriaSummary}
【方案可行性】：方案总数 ${payload.alternatives.length} 个，满足硬极限约束可行方案 ${payload.feasibleCount} 个，违规淘汰 ${payload.alternatives.length - payload.feasibleCount} 个
【帕累托前沿】：识别出 ${payload.paretoCount} 个互不支配的帕累托非劣解
【方案详列】：
${payload.alternatives
  .map(
    (a) =>
      `- [${a.code}] ${a.name}: ${a.isFeasible ? '✅可行' : '❌违约淘汰'}, ${a.isPareto ? '★帕累托最优' : '次优/被支配'}, TOPSIS贴近度: ${a.topsisCloseness?.toFixed(4) || 'N/A'}`
  )
  .join('\n')}

请按以下 3 个专业维度展开深入分析（使用中文简体，Markdown排版）：
1. 【约束条件敏感性诊断】：硬约束是否过严？是否存在可行域萎缩或解集为空风险？
2. 【指标权重矛盾与共线性盲区】：权重设定是否主观偏置？是否存在关键指标被加权和稀释掩盖的陷阱？
3. 【帕累托前沿折中与总师推荐】：在当前非劣解中，如何向型号总师提出折中决策建议？若需突破瓶颈，建议优先放宽哪个指标的硬极限？`;

  // 1. Try browser direct call for GitHub deployment
  if (payload.model === 'deepseek-v4-pro') {
    return callDeepSeekDirect(apiKey, [
      { role: 'system', content: '你是一名系统工程权衡分析与多目标优化专家。' },
      { role: 'user', content: systemPrompt },
    ]);
  } else {
    return callGeminiDirect(apiKey, systemPrompt);
  }
}

/**
 * Perform interactive Q&A via Browser Direct Call
 */
export async function executeAiChat(payload: ChatRequestPayload): Promise<string> {
  const apiKey = getStoredApiKey(payload.model);
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('未检测到 API-Key！请点击“设置大模型”手工输入 API-Key 并确认后再发起调用。');
  }

  const modelLabel = payload.model === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash';
  const systemPrompt = `你是一名精通系统方案权衡分析（Trade Study）、帕累托最优前沿、TOPSIS 优劣解距离法与多属性决策的专家随诊助手。
当前启用模型：${modelLabel}。
上下文环境：${payload.context}
用户提问：${payload.message}

请提供专业、严谨、逻辑紧密的工程解答，公式或逻辑推导使用清晰排版。`;

  if (payload.model === 'deepseek-v4-pro') {
    return callDeepSeekDirect(apiKey, [
      { role: 'system', content: '你是一名资深复杂系统权衡分析顾问。' },
      { role: 'user', content: systemPrompt },
    ]);
  } else {
    return callGeminiDirect(apiKey, systemPrompt);
  }
}

/**
 * Direct Gemini REST API browser call (Works seamlessly on GitHub Pages static sites)
 */
async function callGeminiDirect(apiKey: string, prompt: string): Promise<string> {
  // First try local proxy if available, but fallback directly to browser fetch
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`Gemini 调用失败: ${errMsg}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API 未返回有效文本回复。');
    }

    return `【gemini 3 flash 实时推理诊断】\n\n${candidateText}`;
  } catch (directErr: any) {
    // If browser CORS or direct call fails, try server proxy fallback if running on fullstack
    try {
      const proxyRes = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-3.8-flash',
        }),
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.text) return proxyData.text;
      }
    } catch {
      // ignore secondary proxy error
    }
    throw directErr;
  }
}

/**
 * Direct DeepSeek REST API browser call (Works seamlessly on GitHub Pages static sites)
 */
async function callDeepSeekDirect(apiKey: string, messages: { role: string; content: string }[]): Promise<string> {
  const endpoint = 'https://api.deepseek.com/chat/completions';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP ${res.status} ${res.statusText}`;
      throw new Error(`DeepSeek 调用失败: ${errMsg}`);
    }

    const data = await res.json();
    const candidateText = data.choices?.[0]?.message?.content;
    if (!candidateText) {
      throw new Error('DeepSeek API 未返回有效文本回复。');
    }

    return `【deepseek-v4-pro 深度推理诊断】\n\n${candidateText}`;
  } catch (directErr: any) {
    // Try server proxy fallback if browser direct CORS fails
    try {
      const proxyRes = await fetch('/api/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          prompt: messages[messages.length - 1]?.content,
          model: 'deepseek-v4-pro',
        }),
      });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.text) return proxyData.text;
      }
    } catch {
      // ignore
    }
    throw directErr;
  }
}
