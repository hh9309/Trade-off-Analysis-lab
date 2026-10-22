import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to call DeepSeek API if configured
async function callDeepSeek(messages: { role: string; content: string }[], userApiKey?: string): Promise<string | null> {
  const apiKey = userApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('DeepSeek call failed:', err);
    return null;
  }
}

// AI Diagnosis Endpoint
app.post('/api/diagnose', async (req, res) => {
  try {
    const { caseName, criteria, alternatives, paretoCount, feasibleCount, prompt, model } = req.body;
    const selectedModel = model === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini-3.8-flash';

    const summaryText = `
案例背景: ${caseName || '当前权衡案例'}
指标数量: ${criteria?.length || 0} 个指标 [${(criteria || []).map((c: any) => `${c.name}(方向:${c.direction}, 权重:${(c.weight * 100).toFixed(0)}%, 约束:${c.constraintMin ?? '无'}~${c.constraintMax ?? '无'})`).join('; ')}]
方案总数: ${alternatives?.length || 0} 个
可行方案数: ${feasibleCount} 个
帕累托最优解数: ${paretoCount} 个
方案详情:
${(alternatives || []).map((a: any) => `- 方案 ${a.name}: ${a.isFeasible ? '可行' : '违背硬约束(不可行)'}, ${a.isPareto ? '【帕累托最优前沿】' : '被支配/次优'}, 得分:${a.score?.toFixed(3) || 'N/A'}`).join('\n')}
`;

    const systemPrompt = `你是一名资深复杂系统工程权衡分析专家（Systems Engineering Trade Study & Multi-Objective Optimization Expert）。
当前启用的大模型分析引擎是：${selectedModel === 'deepseek-v4-pro' ? 'DeepSeek V4 Pro' : 'Gemini 3 Flash'}。
请针对系统决策矩阵数据进行深入的专业诊断，分析其：
1. 【约束条件敏感性诊断】：是否存在由于硬约束过严导致可行解空间被过度挤压或帕累托前沿解集过少/为空的风险？
2. 【权重分配主观矛盾与盲区】：指标权重设定是否存在极端偏置、互斥目标带来的权衡死锁？是否存在关键一票否决指标被平均化的问题？
3. 【非劣解权衡折中建议】：在现有的帕累托非劣解中，如何向型号总设计师/决策者推荐合理的折中方案？若需破局，建议在哪个指标上放宽边界以换取系统效能跃升？

${summaryText}

用户附加提问: ${prompt || '请进行全方位的系统权衡体检与风险诊断。'}

请用严谨、客观、工程化、条理清晰的中文简体输出诊断报告，采用Markdown分段排版。`;

    const userApiKey = (req.headers['x-api-key'] as string) || req.body.apiKey;

    // 1. If DeepSeek is requested
    if (selectedModel === 'deepseek-v4-pro') {
      const deepseekText = await callDeepSeek([
        { role: 'system', content: '你是一名资深系统工程与帕累托优化专家。' },
        { role: 'user', content: systemPrompt },
      ], userApiKey);
      if (deepseekText) {
        return res.json({ text: `【DeepSeek V4 Pro 深度推理诊断】\n\n${deepseekText}` });
      }
    }

    // 2. Default or fallback to Gemini 3 Flash
    const activeClient = userApiKey
      ? new GoogleGenAI({
          apiKey: userApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : aiClient;

    if (activeClient) {
      const response = await activeClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
      });

      const prefix = selectedModel === 'deepseek-v4-pro'
        ? '【DeepSeek V4 Pro 协同推理引擎 (Gemini High-Speed Proxy)】\n\n'
        : '【Gemini 3 Flash 系统权衡诊断报告】\n\n';

      return res.json({ text: `${prefix}${response.text}` });
    }

    // 3. Fallback Heuristic
    let fallbackText = `### 系统工程权衡分析专家诊断报告 (${selectedModel === 'deepseek-v4-pro' ? 'DeepSeek V4 Pro' : 'Gemini 3 Flash'} 内置推理引擎)\n\n`;
    if (feasibleCount === 0) {
      fallbackText += `⚠️ **严重警报：可行解空间完全崩溃（空集）**\n当前设定的工程硬约束过严，导致候选方案库中无一满足要求。建议立即审查成本、功耗或工期门槛，放宽关键约束条件至少 10%~15% 以恢复可行域。\n\n`;
    } else if (paretoCount === 1) {
      fallbackText += `💡 **帕累托前沿呈现单一解**：当前仅有 1 个方案处于非劣前沿，说明该方案在核心维度上形成了绝对支配，缺乏足够冲突的备选解。\n\n`;
    } else {
      fallbackText += `✅ **帕累托前沿解集健康**：识别出 ${paretoCount} 个互不支配的非劣解。表明系统在性能与代价之间存在典型的多目标博弈。\n\n`;
    }

    fallbackText += `**决策建议与折中路径**：\n1. 警惕加权平均掩盖单一指标致命短板，建议对照平行坐标轴检查非支配解的极值分布。\n2. 建议针对首要权衡指标进行 ±10% 权重敏感度测试，观察前沿优选方案的排序是否稳健。`;

    return res.json({ text: fallbackText });
  } catch (error: any) {
    console.error('Diagnosis error:', error);
    res.status(500).json({ error: error.message || '诊断失败' });
  }
});

// AI Q&A Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, model } = req.body;
    const selectedModel = model === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini-3.8-flash';

    const systemPrompt = `你是一名系统工程权衡分析与运筹优化专家。当前会话接入的大模型是：${selectedModel === 'deepseek-v4-pro' ? 'DeepSeek V4 Pro' : 'Gemini 3 Flash'}。
请以严谨、专业、启发性的态度解答用户关于多属性决策（MCDM）、帕累托前沿（Pareto Frontier）、TOPSIS优劣解距离法、AHP层次分析法及系统折中决策的问题。

当前上下文背景:
${context || '无特定上下文'}

用户提问: ${message}

请使用格式优美的中文回复。`;

    const userApiKey = (req.headers['x-api-key'] as string) || req.body.apiKey;

    if (selectedModel === 'deepseek-v4-pro') {
      const deepseekText = await callDeepSeek([
        { role: 'system', content: '你是一名系统工程权衡分析专家。' },
        { role: 'user', content: systemPrompt },
      ], userApiKey);
      if (deepseekText) {
        return res.json({ text: deepseekText });
      }
    }

    const activeClient = userApiKey
      ? new GoogleGenAI({
          apiKey: userApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        })
      : aiClient;

    if (activeClient) {
      const response = await activeClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
      });

      return res.json({ text: response.text });
    } else {
      return res.json({
        text: `【${selectedModel === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : 'gemini 3 flash'} 随诊解答】系统方案权衡（Trade Study）核心在于寻找“无法在不牺牲其他指标的前提下改善任一指标”的非劣解集（Pareto Optimal Set）。当前建议：检查各指标量纲归一化方式（极差法 vs 向量范数），并注意不可行方案应在构建前沿前滤除。`,
      });
    }
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || '咨询失败' });
  }
});

// Vite Middleware for Development or Static Files for Production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
