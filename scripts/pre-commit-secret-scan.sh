#!/usr/bin/env bash
# scripts/pre-commit-secret-scan.sh
#
# Pre-commit hook: scan staged files for accidentally committed secrets.
# Install by copying (or symlinking) to .git/hooks/pre-commit:
#
#   cp scripts/pre-commit-secret-scan.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Requires gitleaks >= 8.x  (https://github.com/gitleaks/gitleaks)
# Falls back to a grep-based check when gitleaks is not installed.

set -euo pipefail

STAGED=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

# ── gitleaks scan (preferred) ─────────────────────────────────────────────────
if command -v gitleaks &>/dev/null; then
  echo "[pre-commit] Running gitleaks secret scan on staged files..."
  if ! gitleaks protect --staged --config .gitleaks.toml --redact 2>&1; then
    echo ""
    echo "❌  gitleaks detected potential secrets in staged files."
    echo "    Review the output above, remove the secrets, and re-stage."
    echo "    To bypass (NOT recommended): git commit --no-verify"
    exit 1
  fi
  echo "[pre-commit] gitleaks: no secrets detected ✓"
  exit 0
fi

# ── Fallback: grep for common secret patterns ─────────────────────────────────
echo "[pre-commit] gitleaks not found — running grep-based secret scan..."

PATTERNS=(
  'CHANGE_ME'
  'password\s*=\s*[^$][^{]'
  'secret\s*=\s*[^$][^{]'
  'S[A-Z2-7]{55}'          # Stellar secret key
  'sk_live_'               # Stripe live key
  'AKIA[0-9A-Z]{16}'       # AWS access key
)

FOUND=0
for FILE in $STAGED; do
  [ -f "$FILE" ] || continue
  # Skip .env.example and docs
  [[ "$FILE" == ".env.example" ]] && continue
  [[ "$FILE" == docs/* ]] && continue

  for PATTERN in "${PATTERNS[@]}"; do
    if git show ":$FILE" | grep -qiE "$PATTERN" 2>/dev/null; then
      echo "❌  Possible secret in $FILE (pattern: $PATTERN)"
      FOUND=1
    fi
  done
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "    Remove the secrets, re-stage, and commit again."
  echo "    To bypass (NOT recommended): git commit --no-verify"
  exit 1
fi

echo "[pre-commit] grep scan: no secrets detected ✓"
