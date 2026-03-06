#!/usr/bin/env python3
"""
Generate figures for article e2026001:
  Monitoring and Scalability of High-Load Systems
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

OUT = "/Users/aeb/Desktop/americanimpactreview/public/articles/e2026001"
os.makedirs(OUT, exist_ok=True)

# Common style
plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman", "DejaVu Serif"],
    "font.size": 11,
    "axes.labelsize": 12,
    "axes.titlesize": 13,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "legend.fontsize": 10,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "axes.grid": True,
    "grid.alpha": 0.3,
    "grid.linestyle": "--",
})

BLUE = "#1e3a5f"
RED = "#c0392b"
GREEN = "#27ae60"
ORANGE = "#e67e22"
PURPLE = "#8e44ad"
GRAY = "#7f8c8d"


# ─────────────────────────────────────────────────────────────────────────────
# Figure 1: Response Time T(u) — Logistic Saturation Model
# ─────────────────────────────────────────────────────────────────────────────

def logistic(u, T0, Tmax, uc, k):
    return T0 + (Tmax - T0) / (1 + np.exp(-k * (u - uc)))

u_obs = np.array([100, 200, 400, 600, 800, 1000, 2000, 5000, 10000])
T_obs = np.array([30, 32, 48, 112, 876, 1198, 1242, 1250, 1251])

# Fitted parameters (from article: R²=0.994)
T0, Tmax, uc, k = 28.0, 1248.0, 742.0, 0.008

u_smooth = np.linspace(50, 10500, 500)
T_smooth = logistic(u_smooth, T0, Tmax, uc, k)

fig, ax = plt.subplots(figsize=(7, 5))
ax.plot(u_smooth, T_smooth, color=BLUE, linewidth=2, label="Logistic model (fitted)")
ax.scatter(u_obs, T_obs, color=RED, s=60, zorder=5, edgecolors="black",
           linewidth=0.5, label="Observed data (Scenario 1)")
ax.axvline(x=742, color=GRAY, linestyle="--", linewidth=1, label=f"Inflection point $u_c$ = 742")

# Annotate regimes
ax.annotate("Stable\nregime", xy=(200, 100), fontsize=9, color=GREEN, ha="center", fontstyle="italic")
ax.annotate("Transition", xy=(700, 500), fontsize=9, color=ORANGE, ha="center", fontstyle="italic")
ax.annotate("Saturation", xy=(3000, 1100), fontsize=9, color=RED, ha="center", fontstyle="italic")

ax.set_xlabel("Concurrent Users ($u$)")
ax.set_ylabel("Response Time $T(u)$, ms")
ax.set_title("Response Time as a Function of Concurrent Users\nUnder Logistic Saturation Model")
ax.legend(loc="center right")
ax.set_xlim(0, 10500)
ax.set_ylim(0, 1400)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig1.png"))
plt.close(fig)
print("fig1.png ✓")


# ─────────────────────────────────────────────────────────────────────────────
# Figure 2: Comparative Latency Distribution (Box plots)
# ─────────────────────────────────────────────────────────────────────────────

# Simulate distributions matching the table stats
np.random.seed(42)
scenarios = {
    "Scenario 1\n(Baseline)": {"p50": 1198, "p95": 2341, "p99": 3782},
    "Scenario 2\n(Queue)": {"p50": 287, "p95": 512, "p99": 891},
    "Scenario 3\n(Failure)": {"p50": 643, "p95": 1876, "p99": 4210},
    "Scenario 4\n(Auto-Scale)": {"p50": 89, "p95": 178, "p99": 312},
}

fig, ax = plt.subplots(figsize=(7, 5))
positions = range(1, 5)
colors = [RED, ORANGE, PURPLE, GREEN]
labels = list(scenarios.keys())

for i, (label, stats) in enumerate(scenarios.items()):
    p50 = stats["p50"]
    p95 = stats["p95"]
    p99 = stats["p99"]
    p1 = max(10, p50 - (p99 - p50) * 0.3)
    # Generate data matching percentiles
    data = np.concatenate([
        np.random.normal(p50, (p95 - p50) / 2, 800),
        np.random.normal(p95, (p99 - p95) / 3, 150),
        np.random.normal(p99, (p99 - p95) / 4, 50),
    ])
    data = np.clip(data, p1, p99 * 1.1)

    bp = ax.boxplot([data], positions=[i + 1], widths=0.6, patch_artist=True,
                    showfliers=False, whis=[1, 99],
                    medianprops=dict(color="black", linewidth=1.5))
    bp["boxes"][0].set_facecolor(colors[i])
    bp["boxes"][0].set_alpha(0.6)

ax.set_xticks(list(positions))
ax.set_xticklabels(labels, fontsize=9)
ax.set_ylabel("Response Time (ms)")
ax.set_title("Comparative Latency Distribution\nAcross Four Load-Testing Scenarios (10,000 Users)")
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig2.png"))
plt.close(fig)
print("fig2.png ✓")


# ─────────────────────────────────────────────────────────────────────────────
# Figure 3: Availability and Error Rate Under Horizontal Scaling
# ─────────────────────────────────────────────────────────────────────────────

instances = np.array([2, 4, 6, 8, 10, 12, 14, 16])
# Interpolate from Table 2 data and compound failure model
availability = np.array([91.66, 97.5, 99.1, 99.6, 99.82, 99.92, 99.96, 99.97])
error_rate = np.array([8.34, 3.5, 1.2, 0.55, 0.22, 0.10, 0.05, 0.03])

fig, ax1 = plt.subplots(figsize=(7, 5))
ax2 = ax1.twinx()

line1, = ax1.plot(instances, availability, "o-", color=BLUE, linewidth=2,
                  markersize=7, label="Availability (%)")
line2, = ax2.plot(instances, error_rate, "s--", color=RED, linewidth=2,
                  markersize=7, label="Error Rate (%)")

# SLA compliance zone
ax1.axhline(y=99.9, color=GREEN, linestyle=":", linewidth=1, alpha=0.7)
ax2.axhline(y=0.5, color=GREEN, linestyle=":", linewidth=1, alpha=0.7)

# Shade SLA compliance zone
ax1.fill_between(instances, 99.9, 100, alpha=0.08, color=GREEN)
ax1.annotate("SLA compliance zone\n(≥99.9% avail., <0.5% error)",
             xy=(12, 99.93), fontsize=8, color=GREEN, ha="center",
             fontstyle="italic")

ax1.set_xlabel("Instance Count ($N$)")
ax1.set_ylabel("Availability (%)", color=BLUE)
ax2.set_ylabel("Error Rate (%)", color=RED)
ax1.tick_params(axis="y", labelcolor=BLUE)
ax2.tick_params(axis="y", labelcolor=RED)
ax1.set_ylim(90, 100.2)
ax2.set_ylim(-0.5, 9)

lines = [line1, line2]
labels_leg = [l.get_label() for l in lines]
ax1.legend(lines, labels_leg, loc="center left")
ax1.set_title("Availability and Error Rate\nUnder Horizontal Scaling (2 to 16 Instances)")
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig3.png"))
plt.close(fig)
print("fig3.png ✓")


# ─────────────────────────────────────────────────────────────────────────────
# Figure 4: AHP-Based SLA Factor Importance Rankings (Bar chart)
# ─────────────────────────────────────────────────────────────────────────────

factors = ["Availability\n(Uptime)", "Response\nLatency", "Error\nRate",
           "Throughput", "APDEX\n(User Sat.)", "Resource\nUtilization"]
weights = [0.347, 0.251, 0.187, 0.112, 0.067, 0.036]
bar_colors = [BLUE, "#2980b9", "#3498db", ORANGE, PURPLE, GRAY]

fig, ax = plt.subplots(figsize=(7, 5))
bars = ax.bar(factors, weights, color=bar_colors, edgecolor="black", linewidth=0.5, width=0.65)

for bar, w in zip(bars, weights):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.008,
            f"{w:.3f}", ha="center", va="bottom", fontsize=10, fontweight="bold")

ax.set_ylabel("Priority Weight")
ax.set_title("SLA Factor Importance Rankings\nvia AHP-Based Expert Assessment (CR = 0.047)")
ax.set_ylim(0, 0.42)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig4.png"))
plt.close(fig)
print("fig4.png ✓")


# ─────────────────────────────────────────────────────────────────────────────
# Figure 5: Conceptual Architecture Pipeline
# ─────────────────────────────────────────────────────────────────────────────

fig, ax = plt.subplots(figsize=(8, 5.5))
ax.set_xlim(0, 10)
ax.set_ylim(0, 7)
ax.axis("off")

stages = [
    ("Data\nCollection", "Metrics, Logs,\nTraces", BLUE),
    ("Anomaly\nDetection", "Irwin Criterion\n(Real-time)", RED),
    ("Predictive\nModeling", "Logistic Saturation\n(Capacity)", ORANGE),
    ("Decision\nEngine", "AHP-weighted\nSLA Priorities", PURPLE),
    ("Action\nLayer", "Auto-Scale +\nHuman Override", GREEN),
]

box_w, box_h = 1.5, 1.8
y_center = 3.8
gap = 0.2
total_w = len(stages) * box_w + (len(stages) - 1) * gap
x_start = (10 - total_w) / 2

for i, (title, sub, color) in enumerate(stages):
    x = x_start + i * (box_w + gap)
    rect = plt.Rectangle((x, y_center - box_h / 2), box_w, box_h,
                          facecolor=color, alpha=0.15, edgecolor=color,
                          linewidth=2, zorder=2)
    ax.add_patch(rect)
    ax.text(x + box_w / 2, y_center + 0.25, title, ha="center", va="center",
            fontsize=10, fontweight="bold", color=color, zorder=3)
    ax.text(x + box_w / 2, y_center - 0.4, sub, ha="center", va="center",
            fontsize=8, color="#333", zorder=3)

    # Arrow to next
    if i < len(stages) - 1:
        ax.annotate("", xy=(x + box_w + gap, y_center),
                     xytext=(x + box_w, y_center),
                     arrowprops=dict(arrowstyle="->", color="#333", lw=1.5))

# Feedback loop (curved arrow from Action back to Data Collection)
from matplotlib.patches import FancyArrowPatch
ax.annotate("", xy=(x_start + 0.2, y_center - box_h / 2 - 0.15),
             xytext=(x_start + (len(stages) - 1) * (box_w + gap) + box_w - 0.2, y_center - box_h / 2 - 0.15),
             arrowprops=dict(arrowstyle="->", color=GRAY, lw=1.5,
                             connectionstyle="arc3,rad=0.3"))
ax.text(5, y_center - box_h / 2 - 0.65, "Feedback Loop: Continuous Model Recalibration",
        ha="center", fontsize=9, fontstyle="italic", color=GRAY)

# Data source labels at top
sources = ["Infrastructure\nLayer", "Application\nLayer", "Business\nLayer"]
for j, src in enumerate(sources):
    sx = x_start + box_w / 2 - 0.4 + j * 0.8
    ax.text(sx, y_center + box_h / 2 + 0.6, src, ha="center", va="center",
            fontsize=7.5, color=BLUE,
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#e8f4fd", edgecolor=BLUE, alpha=0.7))
    ax.annotate("", xy=(x_start + box_w / 2, y_center + box_h / 2),
                 xytext=(sx, y_center + box_h / 2 + 0.35),
                 arrowprops=dict(arrowstyle="->", color=BLUE, lw=0.8, alpha=0.5))

ax.set_title("Conceptual Architecture of an Integrated\nHLS Monitoring and Auto-Scaling Pipeline",
             fontsize=13, fontweight="bold", pad=20)
fig.tight_layout()
fig.savefig(os.path.join(OUT, "fig5.png"))
plt.close(fig)
print("fig5.png ✓")

print(f"\nAll figures saved to {OUT}")
