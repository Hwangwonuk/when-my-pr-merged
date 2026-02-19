/**
 * 배포 전 환경 변수 및 설정 검증 스크립트
 * Usage: npx tsx scripts/setup-check.ts
 */
import "dotenv/config";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, failMsg: string, warnOnly = false) {
  results.push({
    name,
    status: condition ? "pass" : warnOnly ? "warn" : "fail",
    message: condition ? "OK" : failMsg,
  });
}

// Required environment variables
const required = [
  "DATABASE_URL",
  "GITHUB_APP_ID",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "SESSION_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

const optional = [
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_SIGNING_SECRET",
  "CRON_SECRET",
];

console.log("\n🔍 환경 변수 검증\n");

for (const key of required) {
  const value = process.env[key];
  check(
    `[필수] ${key}`,
    !!value && value.length > 0,
    `설정되지 않음 — .env 또는 Vercel 환경변수에 추가하세요`
  );
}

for (const key of optional) {
  const value = process.env[key];
  check(
    `[선택] ${key}`,
    !!value && value.length > 0,
    `미설정 — Slack 연동/크론 보안을 위해 권장`,
    true
  );
}

// Validate specific formats
const dbUrl = process.env.DATABASE_URL || "";
check(
  "DATABASE_URL 형식",
  dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://"),
  `PostgreSQL URL이어야 합니다 (현재: ${dbUrl.substring(0, 20)}...)`,
);

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
check(
  "NEXT_PUBLIC_APP_URL 형식",
  appUrl.startsWith("http://") || appUrl.startsWith("https://"),
  `유효한 URL이어야 합니다 (현재: ${appUrl})`,
);

const privateKey = process.env.GITHUB_APP_PRIVATE_KEY || "";
check(
  "GITHUB_APP_PRIVATE_KEY 형식",
  privateKey.includes("BEGIN") || privateKey.includes("\\n"),
  `PEM 형식이어야 합니다 (-----BEGIN RSA PRIVATE KEY----- ...)`,
);

const sessionSecret = process.env.SESSION_SECRET || "";
check(
  "SESSION_SECRET 길이",
  sessionSecret.length >= 32,
  `최소 32자 이상이어야 합니다 (현재: ${sessionSecret.length}자)`,
);

// Print results
console.log("─".repeat(60));
let hasFailure = false;
for (const r of results) {
  const icon = r.status === "pass" ? "✅" : r.status === "warn" ? "⚠️" : "❌";
  console.log(`${icon} ${r.name}: ${r.message}`);
  if (r.status === "fail") hasFailure = true;
}
console.log("─".repeat(60));

const passCount = results.filter((r) => r.status === "pass").length;
const warnCount = results.filter((r) => r.status === "warn").length;
const failCount = results.filter((r) => r.status === "fail").length;
console.log(`\n결과: ✅ ${passCount} 통과 | ⚠️ ${warnCount} 경고 | ❌ ${failCount} 실패\n`);

if (hasFailure) {
  console.log("❌ 필수 항목이 누락되었습니다. 배포 전에 수정해주세요.\n");
  process.exit(1);
} else {
  console.log("✅ 배포 준비가 완료되었습니다!\n");
}
