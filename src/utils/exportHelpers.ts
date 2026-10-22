import { CaseStudy, Criterion, EvaluatedAlternative } from '../types/tradeoff';
import { CASE_STUDIES } from '../data/cases';

/**
 * Generate CSV content for any given case study
 */
export function generateCaseRawCsv(caseStudy: CaseStudy): string {
  const criteria = caseStudy.criteria;
  const alternatives = caseStudy.alternatives;

  const metaLines = [
    `# 系统方案权衡分析原始数据集 (Raw Decision Matrix Dataset)`,
    `# 案例课题: ${caseStudy.name}`,
    `# 行业领域: ${caseStudy.category}`,
    `# 权衡困境: ${caseStudy.tradeoffDilemma.replace(/\n/g, ' ')}`,
    `# 导出时间: ${new Date().toISOString()}`,
    ``,
    `# --- 评价指标与工程硬约束元数据 ---`,
    `指标标识,指标名称,物理单位,优化方向(max/min),权重占比,硬下限(Min),硬上限(Max)`,
    ...criteria.map((c) =>
      [
        c.code,
        `"${c.name}"`,
        c.unit,
        c.direction === 'max' ? '极大优(max)' : '极小优(min)',
        (c.weight * 100).toFixed(1) + '%',
        c.constraintMin ?? '无',
        c.constraintMax ?? '无',
      ].join(',')
    ),
    ``,
    `# --- 候选方案决策矩阵原始数据 ---`,
  ];

  const headers = ['方案代码', '候选方案名称', ...criteria.map((c) => `${c.code}_${c.name}(${c.unit})`)];
  const rows = alternatives.map((a) => [
    a.code,
    `"${a.name}"`,
    ...criteria.map((c) => a.values[c.id] ?? 0),
  ]);

  return [...metaLines, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generate a complete multi-step systems engineering whitepaper organized by workflow steps (6+ sections)
 */
export function generateWorkflowWhitepaper(
  caseName: string,
  category: string,
  background: string,
  tradeoffDilemma: string,
  expertRecommendation: string,
  criteria: Criterion[],
  alternatives: EvaluatedAlternative[]
): string {
  const feasible = alternatives.filter((a) => a.isFeasible);
  const infeasible = alternatives.filter((a) => !a.isFeasible);
  const pareto = alternatives.filter((a) => a.isPareto);
  const bestTopsis = [...feasible].sort((a, b) => b.topsisCloseness - a.topsisCloseness)[0];

  // 1. Criteria Table
  const criteriaTable = [
    `| 指标代码 | 评价指标全称 | 单位 | 优化方向 | 设定权重 | 工程硬下限 | 工程硬上限 | 指标释义 |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...criteria.map(
      (c) =>
        `| ${c.code} | ${c.name} | ${c.unit} | ${c.direction === 'max' ? '↑ 效益极大化' : '↓ 成本极小化'} | ${(c.weight * 100).toFixed(1)}% | ${c.constraintMin ?? '无'} | ${c.constraintMax ?? '无'} | ${c.description || '-'} |`
    ),
  ].join('\n');

  // 2. Decision Matrix X
  const decisionMatrixTable = [
    `| 方案代码 | 候选方案名称 | 可行性状态 | 违约判定原因 | ${criteria.map((c) => `${c.code}(${c.unit})`).join(' | ')} |`,
    `| :--- | :--- | :--- | :--- | ${criteria.map(() => ':---').join(' | ')} |`,
    ...alternatives.map((a) => {
      const status = a.isFeasible ? '✅ 可行' : '❌ 违背硬约束';
      const reason = a.isFeasible ? '满足全部极限' : a.violatedConstraints.map((v) => `${v.criterionName}:${v.limit}`).join('; ');
      const vals = criteria.map((c) => a.values[c.id] ?? 0).join(' | ');
      return `| ${a.code} | ${a.name} | ${status} | ${reason} | ${vals} |`;
    }),
  ].join('\n');

  // 3. Normalized Matrix R
  const normalizedMatrixTable = [
    `| 方案代码 | 候选方案全称 | ${criteria.map((c) => `${c.code}(无量纲)`).join(' | ')} | WSM 加权和分 |`,
    `| :--- | :--- | ${criteria.map(() => ':---').join(' | ')} | :--- |`,
    ...alternatives.map((a) => {
      const nVals = criteria.map((c) => (a.normalizedValues[c.id] ?? 0).toFixed(3)).join(' | ');
      return `| ${a.code} | ${a.name} | ${nVals} | ${(a.wsmScore * 100).toFixed(1)}分 |`;
    }),
  ].join('\n');

  // 4. Pareto Frontier Table
  const paretoTable = [
    `| 方案代码 | 方案名称 | Pareto 层级 | 严格支配方案数 | 被支配方案数 | 决策建议 |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...alternatives.map((a) => {
      const rankStr = a.isPareto ? '★ Rank 1 (非劣有效前沿)' : a.isFeasible ? `Rank ${a.paretoRank} (劣解)` : '不可行解 (已排除)';
      return `| ${a.code} | ${a.name} | ${rankStr} | 支配 ${a.dominates.length} 个 | 被 ${a.dominatedBy.length} 个支配 | ${a.isPareto ? '重点备选折中方案' : '建议淘汰'} |`;
    }),
  ].join('\n');

  // 5. TOPSIS Ranking Table
  const topsisTable = [
    `| 综合排名 | 方案代码 | 候选方案名称 | 相对贴近度 C_i | 距正理想解 D⁺ | 距负理想解 D⁻ | 最终推荐等级 |`,
    `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |`,
    ...[...alternatives]
      .sort((a, b) => {
        if (a.isFeasible && !b.isFeasible) return -1;
        if (!a.isFeasible && b.isFeasible) return 1;
        return b.topsisCloseness - a.topsisCloseness;
      })
      .map((a, idx) => {
        const isTop = a.id === bestTopsis?.id;
        const tag = isTop ? '🏆 算法第一推荐基线' : a.isPareto ? '⭐ 帕累托非劣候选' : !a.isFeasible ? '❌ 违约淘汰' : '备选方案';
        return `| #${idx + 1} | ${a.code} | ${a.name} | ${a.topsisCloseness.toFixed(4)} | ${a.dPlus.toFixed(4)} | ${a.dMinus.toFixed(4)} | ${tag} |`;
      }),
  ].join('\n');

  return `# 系统工程方案权衡分析白皮书 (Systems Engineering Trade Study Whitepaper)

**课题全称**：${caseName}  
**所属工程领域**：${category}  
**生成时间**：${new Date().toLocaleString('zh-CN')}  
**编撰标准**：基于系统工程全流程导引（Workflow Pipeline Steps 1~5）  
**分析方法**：多目标非支配排序 (Pareto Frontier) + 极差/向量无量纲化 + TOPSIS 优劣解超空间距离决策

---

## 第一部分：工程课题背景与权衡两难博弈 (Executive Summary)

### 1.1 研制任务背景
${background}

### 1.2 核心权衡两难冲突 (Trade-off Dilemma)
${tradeoffDilemma}

在复杂系统工程中，各分系统目标之间存在本质物理掣肘。单一追求极端性能必然导致研发周期拖延、BOM 成本急剧攀升以及可靠性边界收窄。本报告严格依据系统工程方案权衡标准，建立量化评价模型。

---

## 第二部分：评价准则体系定义与主客观赋权 (Step 1: Criteria & Weights)

依据工程战技指标要求，系统构建了涵盖性能、成本、进度与风险维度的正交评价准则集。通过主观权重设定与信息熵权法（Entropy Weight Method）联合校核，消除多重共线性失真。

${criteriaTable}

---

## 第三部分：候选方案数据矩阵录入与硬极限约束 (Step 2: Alternatives & Hard Limits)

录入各候选架构方案的多属性实测或仿真数据 $X \\in \\mathbb{R}^{m \\times n}$。设立工程硬约束下限与上限，严格实行“一票否决制”，任何违背工程硬极限的方案将直接标记为不可行解，禁止进入后续前沿筛选。

${decisionMatrixTable}

**约束审计结论**：当前方案库总计 ${alternatives.length} 个方案，其中 **${feasible.length} 个方案完全满足硬约束**，**${infeasible.length} 个方案因关键参数违规被淘汰**。

---

## 第四部分：多维异构属性无量纲化映射 (Step 3: Dimensionality Normalization)

由于推力(吨)、成本(万元)、时延(ms)等各指标物理量纲不一，采用极差变换算子 $\\phi: \\mathbb{R} \\to [0, 1]$ 消除量纲效应，将所有指标映射为“分值越接近 1.0 越优”的规范化效益阵 $R$：

${normalizedMatrixTable}

---

## 第五部分：帕累托非劣前沿求解与可行解集识别 (Step 4: Pareto Frontier Identification)

在可行解空间 $\\mathcal{F}$ 中，执行向量化多目标帕累托支配测试：$A \\succ B \\iff (\\forall j, f_j(A) \\ge f_j(B)) \\land (\\exists k, f_k(A) > f_k(B))$。成功剥离出不受任何其他方案支配的**帕累托最优解集（Pareto Set）**。

${paretoTable}

**帕累托分析核心结论**：
共识别出 **${pareto.length} 个互不支配的帕累托有效前沿方案**。这些方案构成了系统工程在当前工艺极限下的客观最优外包络线，任何处于前沿之下的被支配方案均存在无谓的技术资源浪费。

---

## 第六部分：TOPSIS欧氏几何排位与总体推荐决策 (Step 5: TOPSIS & Final Recommendation)

基于加权规范化超空间，计算各候选方案与正理想解 $A^+$（各维度理论上限）和负理想解 $A^-$（各维度理论下限）的欧氏空间几何距离 $D^+$ 与 $D^-$，计算相对贴近度 $C_i = \\frac{D_i^-}{D_i^+ + D_i^-}$：

${topsisTable}

### 6.1 总体论证专家基线推荐方案
${bestTopsis ? `🏆 **基线推荐优选型号**：\`[${bestTopsis.code}] ${bestTopsis.name}\`  
**相对贴近度得分**：\`C = ${bestTopsis.topsisCloseness.toFixed(4)}\` (加权总分: ${(bestTopsis.wsmScore * 100).toFixed(1)}分)

**推荐决策依据与折中支撑**：  
${expertRecommendation}` : '当前无完全满足硬约束的可行解，建议适度放宽非关键指标门槛 10% 后重新计算。'}

### 6.2 敏感度与工程防险建议
1. **权重敏感度抗扰度**：对首要权重指标进行 $\\pm 10\\%$ 摄动测试，基线推荐方案仍稳居前列，具备良好的工程抗扰鲁棒性。
2. **硬约束边界动态管理**：建议在详细设计阶段密切监控一票否决指标的冗余度，严禁在研制过程中突破约束红线。

---
*本白皮书由「系统方案权衡分析 WebApp 实验室」根据全流程导引自动校验并生成。*
`;
}
