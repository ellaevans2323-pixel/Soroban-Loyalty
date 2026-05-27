# Benchmarks

## GET /campaigns (k6)

Requirements: Postgres, Redis, k6, backend running on `:3001`.

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/migrations/002_add_performance_indexes.sql

cd backend
npm ci
npm run seed:perf
# start API (ENABLE_INDEXER=false), then:
BASE_URL=http://localhost:3001 ./benchmarks/k6/run-get-campaigns.sh
```

Script: `k6/get-campaigns.js` — 100 VUs, 30s, p95 &lt; 200ms, errors &lt; 0.1%.

Results: `reports/get-campaigns-baseline.md`
