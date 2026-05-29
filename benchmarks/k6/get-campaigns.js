/**
 * Load test: GET /campaigns
 * Issue #399 — 100 VUs, 30s, p95 < 200ms, error rate < 0.1%
 *
 * Run: BASE_URL=http://localhost:3001 k6 run benchmarks/k6/get-campaigns.js
 */
import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

export const options = {
  vus: 100,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<200"],
    http_req_failed: ["rate<0.001"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/campaigns?limit=20&offset=0`);

  check(res, {
    "status is 200": (r) => r.status === 200,
    "has campaigns array": (r) => {
      try {
        const body = r.json();
        return Array.isArray(body.campaigns) && typeof body.total === "number";
      } catch {
        return false;
      }
    },
  });
}
