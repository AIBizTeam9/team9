#!/usr/bin/env node
// Supabase Postgres에 supabase/migration.sql을 그대로 실행.
// Vercel 빌드(vercel-build)에서 자동 호출되어 SQL Editor 수동 작업이 필요 없게 함.
//
// 사용:
//   npm run migrate                # DIRECT_URL 또는 DATABASE_URL 필요
//   npm run migrate -- --check     # 연결만 확인하고 종료
//
// 환경변수 우선순위: DIRECT_URL > DATABASE_URL.
// DIRECT_URL은 pgbouncer를 우회한 직접 연결 — DDL에 권장.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "..", "supabase", "migration.sql");

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.log(
    "[migrate] DIRECT_URL/DATABASE_URL not set — skipping migration (this is fine for local dev without DB)",
  );
  process.exit(0);
}

// Supabase의 pooler URL은 pgbouncer 모드라서 일부 DDL이 안 먹음 — DIRECT_URL 권장.
if (connectionString.includes("pgbouncer=true")) {
  console.warn(
    "[migrate] ⚠ pgbouncer URL detected — DDL may fail. Set DIRECT_URL to the direct connection URI.",
  );
}

const checkOnly = process.argv.includes("--check");

const sql = readFileSync(sqlPath, "utf8");
const client = new pg.Client({
  connectionString,
  // Supabase는 SSL 필요. NODE_TLS_REJECT_UNAUTHORIZED 우회는 의도적.
  ssl: connectionString.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : undefined,
});

try {
  await client.connect();
  console.log("[migrate] connected");
  if (checkOnly) {
    console.log("[migrate] ✓ connection ok (--check, skipping execution)");
    process.exit(0);
  }
  console.log("[migrate] applying", sqlPath);
  await client.query(sql);
  console.log("[migrate] ✓ migration applied");
} catch (err) {
  console.error(
    "[migrate] ✗ migration failed:",
    err instanceof Error ? err.message : String(err),
  );
  // Vercel 빌드 자체는 깨뜨리지 않음 — 마이그레이션 실패해도 앱은 배포되게.
  // (스키마가 이미 맞다면 다음 배포에서 정상 작동)
  if (process.env.VERCEL) {
    console.warn(
      "[migrate] continuing build despite migration failure (set MIGRATE_STRICT=1 to fail build)",
    );
    if (process.env.MIGRATE_STRICT === "1") process.exit(1);
    process.exit(0);
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
