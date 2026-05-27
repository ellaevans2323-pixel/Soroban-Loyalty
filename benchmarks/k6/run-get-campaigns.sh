#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BASE_URL="${BASE_URL:-http://localhost:3001}"
K6_BIN="${K6_BIN:-k6}"

curl -sf "${BASE_URL}/campaigns?limit=1" >/dev/null || {
  echo "No server at ${BASE_URL}"
  exit 1
}

exec "${K6_BIN}" run \
  --summary-export "${ROOT}/benchmarks/reports/get-campaigns-summary.json" \
  -e "BASE_URL=${BASE_URL}" \
  "${ROOT}/benchmarks/k6/get-campaigns.js"
