"""
Generate 5 high-quality scientific figures for article e2026001
Style: Nature/Science/PLOS ONE — clean, professional, publication-ready
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.ticker import MaxNLocator, FuncFormatter
from matplotlib.gridspec import GridSpec
import os

OUT = "/Users/aeb/Desktop/americanimpactreview/public/articles/e2026001"
os.makedirs(OUT, exist_ok=True)

# === NATURE/SCIENCE STYLE PALETTE ===
C_NAVY    = '#1F3044'
C_BLUE    = '#2171B5'
C_DBLUE   = '#084594'
C_ORANGE  = '#D94801'
C_RED     = '#CB181D'
C_GREEN   = '#238B45'
C_PURPLE  = '#6A3D9A'
C_GOLD    = '#B8860B'
C_GRAY    = '#636363'
C_LGRAY   = '#D9D9D9'

# Publication-quality rcParams
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['Helvetica', 'Arial', 'DejaVu Sans'],
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.titleweight': 'bold',
    'axes.labelsize': 12,
    'axes.labelweight': 'bold',
    'axes.linewidth': 1.2,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'figure.facecolor': 'white',
    'axes.facecolor': 'white',
    'axes.edgecolor': '#333333',
    'axes.grid': False,
    'xtick.major.width': 1.0,
    'ytick.major.width': 1.0,
    'xtick.direction': 'out',
    'ytick.direction': 'out',
    'legend.frameon': True,
    'legend.framealpha': 0.95,
    'legend.edgecolor': '#CCCCCC',
    'legend.fontsize': 10,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'savefig.pad_inches': 0.15,
})


# ============================================================
# FIGURE 1: Logistic Saturation Model
# ============================================================
def fig1():
    T0, Tmax, k, uc = 28.3, 1247.6, 0.0087, 742

    u_obs = np.array([100, 200, 400, 600, 800, 1000, 2000, 5000, 10000])
    T_obs = np.array([30, 32, 48, 112, 876, 1198, 1242, 1250, 1251])

    u_model = np.linspace(50, 10500, 600)
    T_model = T0 + (Tmax - T0) / (1 + np.exp(-k * (u_model - uc)))

    fig, ax = plt.subplots(figsize=(8, 5))

    # Regime shading (subtle)
    ax.axvspan(50, 400, alpha=0.04, color=C_GREEN)
    ax.axvspan(400, 1000, alpha=0.04, color=C_GOLD)
    ax.axvspan(1000, 10500, alpha=0.04, color=C_RED)

    # Model curve
    ax.plot(u_model, T_model, color=C_BLUE, linewidth=2.2, zorder=3, label='Fitted logistic model ($R^2$ = 0.994)')

    # Observed data
    ax.scatter(u_obs, T_obs, color=C_ORANGE, s=55, zorder=4, edgecolors='black', linewidth=0.6, label='Observed data (Scenario 1)')

    # Inflection point
    T_uc = T0 + (Tmax - T0) / (1 + np.exp(-k * (uc - uc)))
    ax.axvline(x=uc, color=C_RED, linestyle=':', linewidth=1.3, alpha=0.6)
    ax.scatter([uc], [T_uc], color=C_RED, s=70, zorder=5, marker='D', edgecolors='black', linewidth=0.6)
    ax.annotate(f'$u_c$ = {uc}', xy=(uc, T_uc), xytext=(uc + 600, T_uc - 100),
               fontsize=10, color=C_RED, fontweight='bold',
               arrowprops=dict(arrowstyle='->', color=C_RED, lw=1.2))

    # Regime labels
    ax.text(200, 1350, 'Stable', fontsize=9, color=C_GREEN, fontstyle='italic', ha='center')
    ax.text(700, 1350, 'Transition', fontsize=9, color=C_GOLD, fontstyle='italic', ha='center')
    ax.text(5000, 1350, 'Saturation', fontsize=9, color=C_RED, fontstyle='italic', ha='center')

    ax.set_xlabel('Concurrent Users ($u$)')
    ax.set_ylabel('Response Time $T(u)$ (ms)')
    ax.set_title('Response Time as a Function of Concurrent Users\nUnder Logistic Saturation Model')
    ax.set_xlim(0, 10800)
    ax.set_ylim(0, 1450)
    ax.legend(loc='center right', fontsize=9.5)

    # Light horizontal grid only
    ax.yaxis.grid(True, alpha=0.2, linestyle='-', color='#999')

    fig.savefig(f"{OUT}/fig1.png")
    plt.close(fig)
    print("  fig1.png")


# ============================================================
# FIGURE 2: Comparative Latency — Grouped Bar + Whisker
# ============================================================
def fig2():
    scenarios = ['Scenario 1\nBaseline (N=2)', 'Scenario 2\nQueued (N=8)', 'Scenario 3\nFailure Inj.', 'Scenario 4\nAuto-Scale']

    p50 = [1198, 287, 643, 89]
    p95 = [2341, 512, 1876, 178]
    p99 = [3782, 891, 4210, 312]

    x = np.arange(len(scenarios))
    width = 0.22

    fig, ax = plt.subplots(figsize=(9, 5.5))

    bars1 = ax.bar(x - width, p50, width, label='p50 (median)', color=C_BLUE, edgecolor='black', linewidth=0.5, zorder=3)
    bars2 = ax.bar(x,         p95, width, label='p95', color=C_ORANGE, edgecolor='black', linewidth=0.5, zorder=3)
    bars3 = ax.bar(x + width, p99, width, label='p99 (tail)', color=C_RED, edgecolor='black', linewidth=0.5, zorder=3)

    # Value labels on p99 bars
    for bar, val in zip(bars3, p99):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 80,
               f'{val}', ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=C_RED)

    ax.set_xticks(x)
    ax.set_xticklabels(scenarios, fontsize=10)
    ax.set_ylabel('Response Time (ms)')
    ax.set_title('Latency Distribution Across Four Load-Testing Scenarios\n(10,000 Concurrent Users)')
    ax.legend(fontsize=10, ncol=3, loc='upper left')
    ax.yaxis.grid(True, alpha=0.2, linestyle='-', color='#999')
    ax.set_ylim(0, 5000)

    # SLA target line
    ax.axhline(y=500, color=C_GREEN, linestyle='--', linewidth=1.2, alpha=0.5)
    ax.text(3.5, 560, 'SLA target (p99 < 500 ms)', fontsize=8.5, color=C_GREEN, ha='right', fontstyle='italic')

    fig.savefig(f"{OUT}/fig2.png")
    plt.close(fig)
    print("  fig2.png")


# ============================================================
# FIGURE 3: Dual-Axis — Availability & Error Rate vs Instances
# ============================================================
def fig3():
    N = np.array([2, 4, 6, 8, 10, 12, 14, 16])
    avail = np.array([91.66, 96.80, 99.12, 98.88, 99.65, 99.87, 99.94, 99.97])
    error = np.array([8.34, 3.20, 0.88, 1.12, 0.35, 0.13, 0.06, 0.03])

    fig, ax1 = plt.subplots(figsize=(8, 5))

    # Availability (left axis)
    ln1 = ax1.plot(N, avail, 'o-', color=C_BLUE, linewidth=2.2, markersize=7,
                   markeredgecolor='black', markeredgewidth=0.5, label='Availability (%)', zorder=3)
    ax1.set_xlabel('Number of Instances ($N$)')
    ax1.set_ylabel('Availability (%)', color=C_BLUE)
    ax1.tick_params(axis='y', labelcolor=C_BLUE)
    ax1.set_ylim(89, 100.5)
    ax1.yaxis.grid(True, alpha=0.15, linestyle='-', color='#999')

    # SLA line
    ax1.axhline(y=99.9, color=C_GREEN, linestyle='--', linewidth=1.3, alpha=0.6)
    ax1.fill_between(N, 99.9, 100.5, alpha=0.07, color=C_GREEN)
    ax1.text(15.5, 100.05, '99.9% SLA', fontsize=8.5, color=C_GREEN, ha='right', fontstyle='italic')

    # Error rate (right axis)
    ax2 = ax1.twinx()
    ax2.spines['right'].set_visible(True)
    ln2 = ax2.plot(N, error, 's-', color=C_RED, linewidth=2.2, markersize=7,
                   markeredgecolor='black', markeredgewidth=0.5, label='Error Rate (%)', zorder=3)
    ax2.set_ylabel('Error Rate (%)', color=C_RED)
    ax2.tick_params(axis='y', labelcolor=C_RED)
    ax2.set_ylim(-0.5, 10)

    # Combined legend
    lns = ln1 + ln2
    labs = [l.get_label() for l in lns]
    ax1.legend(lns, labs, loc='center right', fontsize=9.5)

    ax1.set_title('Availability and Error Rate Under\nHorizontal Scaling (2 to 16 Instances)')
    ax1.xaxis.set_major_locator(MaxNLocator(integer=True))

    fig.savefig(f"{OUT}/fig3.png")
    plt.close(fig)
    print("  fig3.png")


# ============================================================
# FIGURE 4: AHP Factor Rankings — Horizontal Bar Chart
# ============================================================
def fig4():
    factors = ['Resource\nUtilization', 'APDEX', 'Throughput', 'Error Rate', 'Latency', 'Availability']
    weights = [0.036, 0.067, 0.112, 0.187, 0.251, 0.347]
    colors  = [C_LGRAY, C_LGRAY, C_GOLD, C_ORANGE, C_BLUE, C_NAVY]

    fig, ax = plt.subplots(figsize=(8, 4.5))

    bars = ax.barh(factors, weights, color=colors, edgecolor='black', linewidth=0.5, height=0.6, zorder=3)

    # Value labels
    for bar, w in zip(bars, weights):
        ax.text(w + 0.008, bar.get_y() + bar.get_height()/2,
               f'{w:.3f}', va='center', fontsize=10.5, fontweight='bold', color='#333')

    # Equal weight reference
    ax.axvline(x=1/6, color=C_GRAY, linestyle=':', linewidth=1.2, alpha=0.5)
    ax.text(1/6 + 0.005, -0.1, 'Equal\nweight', fontsize=8, color=C_GRAY, fontstyle='italic')

    ax.set_xlabel('Priority Weight')
    ax.set_title('SLA Factor Importance Rankings\n(AHP, $n$ = 5 experts, CR = 0.047)')
    ax.set_xlim(0, 0.42)
    ax.xaxis.grid(True, alpha=0.15, linestyle='-', color='#999')

    fig.savefig(f"{OUT}/fig4.png")
    plt.close(fig)
    print("  fig4.png")


# ============================================================
# FIGURE 5: Pipeline Architecture Diagram (clean, no overlaps)
# ============================================================
def fig5():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8.5)
    ax.axis('off')

    # Title
    ax.text(7.0, 8.1, 'Integrated HLS Monitoring and Auto-Scaling Pipeline',
           ha='center', va='center', fontsize=16, fontweight='bold', color=C_NAVY)

    # ---- ROW 1: Data Sources (top) ----
    src_y = 6.6
    src_h = 0.7
    src_w = 2.4
    sources = [
        ('Metrics (Prometheus)', 0.5),
        ('Logs (ELK Stack)',     3.4),
        ('Traces (Jaeger)',      6.3),
        ('Business KPIs',       9.2),
    ]
    for label, sx in sources:
        rect = mpatches.FancyBboxPatch((sx, src_y), src_w, src_h,
               boxstyle="round,pad=0.1", facecolor='#EAEAEA', edgecolor='#888', linewidth=1.3, zorder=2)
        ax.add_patch(rect)
        ax.text(sx + src_w/2, src_y + src_h/2, label,
               ha='center', va='center', fontsize=9.5, color='#333', zorder=3)

    # Label above sources
    ax.text(7.0, 7.6, 'Data Sources', ha='center', fontsize=11, fontstyle='italic', color=C_GRAY)

    # ---- Vertical arrows from sources down to a collector bar ----
    bar_y_top = 6.1
    bar_y_bot = 5.8
    # Collector bar (thin horizontal)
    rect_bar = mpatches.FancyBboxPatch((0.3, bar_y_bot), 13.0, 0.3,
               boxstyle="round,pad=0.05", facecolor='#D5D5D5', edgecolor='#999', linewidth=0.8, zorder=1)
    ax.add_patch(rect_bar)
    ax.text(12.5, bar_y_bot + 0.15, 'Data Bus', ha='center', va='center',
           fontsize=8, color='#666', fontstyle='italic', zorder=2)

    for _, sx in sources:
        cx = sx + src_w / 2
        ax.annotate('', xy=(cx, bar_y_top), xytext=(cx, src_y - 0.02),
                   arrowprops=dict(arrowstyle='->', color='#888', lw=1.3), zorder=1)

    # ---- ROW 2: Main pipeline (5 stages) ----
    pipe_y = 2.8
    pipe_h = 2.5
    pipe_w = 2.3
    gap = 0.4
    start_x = 0.3

    stages = [
        {'color': C_NAVY,   'title': '1. DATA\nCOLLECTION',
         'items': ['Infrastructure Layer', 'Application Layer', 'Business Layer']},
        {'color': C_PURPLE, 'title': '2. ANOMALY\nDETECTION',
         'items': ['Irwin Criterion', 'Statistical Tests', 'Threshold Alerts']},
        {'color': C_BLUE,   'title': '3. PREDICTIVE\nMODELING',
         'items': ['Logistic Saturation', 'USL Analysis', 'Failure Probability']},
        {'color': C_GREEN,  'title': '4. DECISION\nENGINE',
         'items': ['AHP-Weighted SLA', 'Evidence Tiers 1-3', 'Risk Assessment']},
        {'color': C_RED,    'title': '5. ACTION\nLAYER',
         'items': ['Auto-Scale (HPA)', 'Human Override', 'Alert Routing']},
    ]

    pipe_positions = []
    for i, s in enumerate(stages):
        px = start_x + i * (pipe_w + gap)
        pipe_positions.append(px)

        rect = mpatches.FancyBboxPatch((px, pipe_y), pipe_w, pipe_h,
               boxstyle="round,pad=0.12", facecolor=s['color'], edgecolor='black',
               linewidth=1.3, alpha=0.93, zorder=2)
        ax.add_patch(rect)

        # Stage title
        ax.text(px + pipe_w/2, pipe_y + pipe_h - 0.3, s['title'],
               ha='center', va='top', fontsize=10, fontweight='bold', color='white', zorder=3)

        # Stage items
        for j, item in enumerate(s['items']):
            ax.text(px + pipe_w/2, pipe_y + pipe_h - 0.9 - j*0.45, item,
                   ha='center', va='top', fontsize=8.5, color='#E0E0E0', zorder=3)

    # Vertical arrow from data bus down to first pipeline box
    cx_first = pipe_positions[0] + pipe_w / 2
    ax.annotate('', xy=(cx_first, pipe_y + pipe_h + 0.02), xytext=(cx_first, bar_y_bot - 0.02),
               arrowprops=dict(arrowstyle='->', color=C_NAVY, lw=2.0), zorder=1)

    # Horizontal arrows between pipeline stages
    for i in range(4):
        x1 = pipe_positions[i] + pipe_w + 0.04
        x2 = pipe_positions[i+1] - 0.04
        ym = pipe_y + pipe_h / 2
        ax.annotate('', xy=(x2, ym), xytext=(x1, ym),
                   arrowprops=dict(arrowstyle='->', color='#333', lw=2.2, shrinkA=0, shrinkB=0), zorder=4)

    # ---- Feedback loop (below pipeline) ----
    fb_y = 2.2
    last_x_center = pipe_positions[4] + pipe_w / 2
    first_x_center = pipe_positions[0] + pipe_w / 2
    ax.annotate('',
               xy=(first_x_center, fb_y), xytext=(last_x_center, fb_y),
               arrowprops=dict(arrowstyle='->', color=C_GOLD, lw=2.2,
                              connectionstyle='arc3,rad=0.3', linestyle='--'), zorder=1)
    ax.text(7.0, 1.0, 'Continuous Feedback Loop — Model Recalibration',
           ha='center', fontsize=11, fontstyle='italic', color=C_GOLD, fontweight='bold')

    fig.savefig(f"{OUT}/fig5.png")
    plt.close(fig)
    print("  fig5.png")


# ============================================================
if __name__ == "__main__":
    print("Generating publication-quality figures for e2026001...")
    fig1()
    fig2()
    fig3()
    fig4()
    fig5()
    print(f"\nAll 5 figures saved to {OUT}/")
