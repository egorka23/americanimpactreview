#!/usr/bin/env bash
set -euo pipefail

MAIN_TEX="${1:-main.tex}"

if [[ ! -f "${MAIN_TEX}" ]]; then
  echo "Missing TeX file: ${MAIN_TEX}"
  exit 1
fi

echo "[latex-lab] Running lualatex (pass 1)..."
lualatex -interaction=nonstopmode -halt-on-error -no-shell-escape "${MAIN_TEX}" >/dev/null

echo "[latex-lab] Running lualatex (pass 2)..."
lualatex -interaction=nonstopmode -halt-on-error -no-shell-escape "${MAIN_TEX}" >/dev/null

echo "[latex-lab] Done."
