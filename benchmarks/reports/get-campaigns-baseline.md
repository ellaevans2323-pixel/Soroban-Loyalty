# GET /campaigns — performance baseline

Issue #399. k6, 100 VUs, 30s, `GET /campaigns?limit=20&offset=0`, 1000 seeded campaigns.

## Results (2026-05-27, local)

| Metric | Value |
|--------|-------|
| Requests | 68,324 (~2,274/s) |
| p50 | 42 ms |
| p95 | 54 ms |
| Errors | 0% |
| Thresholds | pass |

Postgres 16, Redis 8.6, `ENABLE_INDEXER=false`. Redis list cache (30s) enabled.

## Reproduce

```bash
cd backend && npm run seed:perf
# API on :3001 with Redis
BASE_URL=http://localhost:3001 k6 run ../benchmarks/k6/get-campaigns.js
```

Without Redis, p95 is much higher (DB-bound under 100 VUs).
