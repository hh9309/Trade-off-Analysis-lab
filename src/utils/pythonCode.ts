import { Criterion, Alternative } from '../types/tradeoff';

export const CRITERION_EN_MAP: Record<string, { name: string; unit: string }> = {
  LEO: { name: 'LEO Payload Capacity', unit: 'Tons' },
  COST_KG: { name: 'Launch Cost per Ton', unit: 'kRMB/Ton' },
  TRL: { name: 'Technology Readiness Level', unit: 'Level 1-9' },
  LEAD_TIME: { name: 'Launch Preparation Cycle', unit: 'Days' },
  DRY_MASS: { name: 'Structural Dry Mass', unit: 'Tons' },
  RANGE: { name: 'CLTC Driving Range', unit: 'km' },
  BAT_COST: { name: 'Battery Pack Cost', unit: 'kRMB' },
  CURB_WEIGHT: { name: 'Vehicle Curb Weight', unit: 'kg' },
  EFFICIENCY: { name: 'Energy Consumption Rate', unit: 'kWh/100km' },
  ACCEL: { name: '0-100km/h Acceleration', unit: 'Seconds' },
  BANDWIDTH: { name: 'Telemetry Link Bandwidth', unit: 'Mbps' },
  LATENCY: { name: 'End-to-End Latency', unit: 'ms' },
  CAPEX: { name: 'Infrastructure CAPEX', unit: 'Million RMB' },
  AVAILABILITY: { name: 'Telemetry Availability', unit: '%' },
  RAIN_FADE: { name: 'Rain Fade Redundancy', unit: 'dB' },
  UNIT_COST: { name: 'Unit Procurement Cost', unit: 'kRMB' },
  SLA: { name: 'SLA Reliability Rate', unit: '%' },
  DEPLOY_DAYS: { name: 'Deployment Schedule', unit: 'Days' },
  INTEROP: { name: 'Interoperability Score', unit: 'Score' },
  SECURITY: { name: 'Security Level Compliance', unit: 'Score' },
  PUE: { name: 'Power Usage Effectiveness', unit: 'PUE' },
  CARBON_REDUCE: { name: 'Carbon Emission Reduction', unit: 'Tons/Yr' },
  RETROFIT_COST: { name: 'Retrofit Initial CAPEX', unit: 'Million RMB' },
  ROI_YEARS: { name: 'Payback Period ROI', unit: 'Years' },
  WATER_SAVING: { name: 'Annual Water Conservation', unit: 'Tons/Yr' },
  PAYLOAD: { name: 'Effective Mission Payload', unit: 'kg' },
  ENDURANCE: { name: 'Flight Endurance Time', unit: 'Hours' },
  UNIT_PRICE: { name: 'Unit Procurement Price', unit: 'kRMB' },
  STEALTH_RCS: { name: 'Radar Cross Section (RCS)', unit: 'm^2' },
  COMM_RADIUS: { name: 'Encrypted Link Radius', unit: 'km' },
};

export function getCriterionEnglishInfo(c: Criterion): { name: string; unit: string } {
  const mapped = CRITERION_EN_MAP[c.code.toUpperCase()];
  if (mapped) return mapped;

  // Fallback: strip non-ascii or return code
  const asciiName = c.name.replace(/[^\x00-\x7F]/g, '').trim();
  const asciiUnit = c.unit.replace(/[^\x00-\x7F]/g, '').trim();
  return {
    name: asciiName || `Criterion ${c.code}`,
    unit: asciiUnit || 'Value',
  };
}

export function generatePythonCode(
  caseName: string,
  criteria: Criterion[],
  alternatives: Alternative[]
): string {
  const criteriaCodes = JSON.stringify(criteria.map((c) => c.code));
  const criteriaEnNames = JSON.stringify(criteria.map((c) => getCriterionEnglishInfo(c).name));
  const criteriaEnUnits = JSON.stringify(criteria.map((c) => getCriterionEnglishInfo(c).unit));
  const altNames = JSON.stringify(alternatives.map((a) => a.name));
  const altCodes = JSON.stringify(alternatives.map((a) => a.code));
  const directions = JSON.stringify(criteria.map((c) => (c.direction === 'max' ? 1 : -1)));
  const weights = JSON.stringify(criteria.map((c) => Number(c.weight.toFixed(4))));

  const matrixRows = alternatives.map((a) => {
    const row = criteria.map((c) => a.values[c.id] ?? 0);
    return `    [${row.join(', ')}]`;
  });

  return `"""
================================================================================
Systems Engineering Trade Study & Multi-Objective Pareto Optimization Engine
Case Study: ${caseName}
Library Requirements: numpy, matplotlib (pip install numpy matplotlib)
Note: All plot titles, legends, axis labels and annotations are strictly in English.
================================================================================
"""

import numpy as np
import matplotlib.pyplot as plt

# 1. Decision Matrix Initialization (m alternatives x n criteria)
# Rows: Alternatives | Columns: Evaluated Criteria
X = np.array([
${matrixRows.join(',\n')}
], dtype=float)

# 2. Metadata & Decision Preferences
ALTERNATIVE_NAMES = ${altNames}
ALTERNATIVE_CODES = ${altCodes}
CRITERIA_CODES = ${criteriaCodes}
CRITERIA_EN_NAMES = ${criteriaEnNames}
CRITERIA_EN_UNITS = ${criteriaEnUnits}

# Direction: +1 for Benefit (Higher is better), -1 for Cost (Lower is better)
DIRECTIONS = np.array(${directions})

# Criteria Weight Vector (Normalized sum = 1.0)
WEIGHTS = np.array(${weights})
WEIGHTS = WEIGHTS / np.sum(WEIGHTS)

# 3. Min-Max Normalization to [0, 1] Range
def normalize_matrix(X, directions):
    m, n = X.shape
    R = np.zeros_like(X)
    min_vals = np.min(X, axis=0)
    max_vals = np.max(X, axis=0)
    diff = max_vals - min_vals
    diff[diff == 0] = 1.0  # Prevent zero division
    
    for j in range(n):
        if directions[j] == 1:
            # Benefit: (x - min) / (max - min)
            R[:, j] = (X[:, j] - min_vals[j]) / diff[j]
        else:
            # Cost: (max - x) / (max - min)
            R[:, j] = (max_vals[j] - X[:, j]) / diff[j]
    return R

# 4. Vectorized Pareto Dominance Filter
def find_pareto_frontier(X, directions):
    """
    Identifies non-dominated alternatives forming the Pareto Frontier.
    Returns: Boolean mask array of shape (m,), True = Pareto Optimal.
    """
    m, n = X.shape
    # Transform to uniform minimization objectives
    costs = np.zeros_like(X)
    for j in range(n):
        costs[:, j] = -X[:, j] if directions[j] == 1 else X[:, j]
            
    is_pareto = np.ones(m, dtype=bool)
    for i in range(m):
        for j in range(m):
            if i != j and is_pareto[i]:
                # Alternative j dominates i iff:
                # All objectives of j <= i and at least one objective of j < i
                if np.all(costs[j] <= costs[i]) and np.any(costs[j] < costs[i]):
                    is_pareto[i] = False
                    break
    return is_pareto

# 5. TOPSIS Closeness Method
def calculate_topsis(R, weights):
    """
    R: Normalized benefit matrix [0, 1]
    weights: Weight vector
    """
    V = R * weights
    ideal_best = np.max(V, axis=0)
    ideal_worst = np.min(V, axis=0)
    
    d_plus = np.sqrt(np.sum((V - ideal_best)**2, axis=1))
    d_minus = np.sqrt(np.sum((V - ideal_worst)**2, axis=1))
    
    closeness = d_minus / (d_plus + d_minus + 1e-12)
    return closeness, d_plus, d_minus

# 6. Plotting Pareto Frontier with English Titles, Legends, and Axes
def plot_pareto_frontier(X, pareto_mask, x_idx=0, y_idx=1):
    """
    Plots the 2D trade-off projection between criteria x_idx and y_idx.
    Strictly uses English for Title, Legend, and Axis Labels.
    """
    plt.figure(figsize=(9, 6), dpi=100)
    
    # Coordinates
    x_vals = X[:, x_idx]
    y_vals = X[:, y_idx]
    
    pareto_indices = np.where(pareto_mask)[0]
    dominated_indices = np.where(~pareto_mask)[0]
    
    # Plot dominated points (English Legend: 'Dominated Alternatives')
    plt.scatter(
        x_vals[dominated_indices],
        y_vals[dominated_indices],
        c='#94a3b8',
        s=85,
        alpha=0.7,
        edgecolors='#475569',
        label='Dominated Alternatives'
    )
    
    # Plot Pareto optimal points (English Legend: 'Pareto Optimal Frontier')
    plt.scatter(
        x_vals[pareto_indices],
        y_vals[pareto_indices],
        c='#10b981',
        s=130,
        alpha=0.95,
        edgecolors='#047857',
        linewidths=1.8,
        label='Pareto Optimal Frontier'
    )
    
    # Sort Pareto points for connected line (English Legend: 'Pareto Frontier Envelope')
    sorted_p_indices = pareto_indices[np.argsort(x_vals[pareto_indices])]
    if len(sorted_p_indices) > 1:
        plt.plot(
            x_vals[sorted_p_indices],
            y_vals[sorted_p_indices],
            '--',
            color='#10b981',
            linewidth=1.8,
            alpha=0.85,
            label='Pareto Frontier Envelope'
        )
        
    # Annotate point codes (pure alphanumeric codes like A1, A2)
    for i in range(len(X)):
        plt.annotate(
            ALTERNATIVE_CODES[i],
            (x_vals[i], y_vals[i]),
            textcoords="offset points",
            xytext=(0, 9),
            ha='center',
            fontsize=9,
            fontweight='bold',
            color='#1e293b'
        )
        
    # English Directions
    x_dir = "Higher is Better" if DIRECTIONS[x_idx] == 1 else "Lower is Better"
    y_dir = "Higher is Better" if DIRECTIONS[y_idx] == 1 else "Lower is Better"
    
    # English Chart Title
    plt.title("Pareto Optimal Frontier & Trade-off Optimization", fontsize=13, fontweight='bold', pad=14)
    
    # English Axes Labels
    x_unit = f", {CRITERIA_EN_UNITS[x_idx]}" if CRITERIA_EN_UNITS[x_idx] else ""
    y_unit = f", {CRITERIA_EN_UNITS[y_idx]}" if CRITERIA_EN_UNITS[y_idx] else ""
    plt.xlabel(f"{CRITERIA_CODES[x_idx]}: {CRITERIA_EN_NAMES[x_idx]} ({x_dir}{x_unit})", fontsize=10, labelpad=8)
    plt.ylabel(f"{CRITERIA_CODES[y_idx]}: {CRITERIA_EN_NAMES[y_idx]} ({y_dir}{y_unit})", fontsize=10, labelpad=8)
    
    # English Legend & Grid
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.legend(loc='best', frameon=True, framealpha=0.9)
    plt.tight_layout()
    
    # Save & Show
    plt.savefig("pareto_frontier_output.png", dpi=300)
    print(">>> [Matplotlib]: Chart saved successfully as 'pareto_frontier_output.png'.")
    plt.show()

# 7. Main Execution Pipeline
def main():
    print("=" * 72)
    print(" Systems Engineering Trade Study Optimization Engine Results ")
    print("=" * 72)
    
    # Normalization
    R = normalize_matrix(X, DIRECTIONS)
    
    # Pareto dominance identification
    pareto_mask = find_pareto_frontier(X, DIRECTIONS)
    
    # TOPSIS Ranking
    closeness, d_plus, d_minus = calculate_topsis(R, WEIGHTS)
    wsm_scores = np.dot(R, WEIGHTS)
    
    print(f"{'Code':<10} | {'Alternative':<22} | {'Pareto':<10} | {'TOPSIS':<10} | {'WSM Score':<10}")
    print("-" * 72)
    for i in range(len(X)):
        p_label = "Optimal" if pareto_mask[i] else "Dominated"
        print(f"{ALTERNATIVE_CODES[i]:<10} | {ALTERNATIVE_NAMES[i][:20]:<22} | {p_label:<10} | {closeness[i]:<10.4f} | {wsm_scores[i]:<10.4f}")
        
    pareto_indices = np.where(pareto_mask)[0]
    best_idx = np.argmax(closeness)
    
    print("=" * 72)
    print(f"★ Pareto Optimal Solutions Count: {len(pareto_indices)}")
    for idx in pareto_indices:
        print(f"   -> [{ALTERNATIVE_CODES[idx]}] {ALTERNATIVE_NAMES[idx]}")
        
    print(f"★ TOPSIS Top Recommendation: [{ALTERNATIVE_CODES[best_idx]}] {ALTERNATIVE_NAMES[best_idx]} (Score: {closeness[best_idx]:.4f})")
    print("=" * 72)
    
    # Render Plot with English labels
    try:
        plot_pareto_frontier(X, pareto_mask, x_idx=0, y_idx=1)
    except Exception as e:
        print(f"Note on headless environment: Plotting skipped ({e}). Image saved.")

if __name__ == '__main__':
    main()
`;
}
