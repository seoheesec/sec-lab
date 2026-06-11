import { createMockResponse, isMockApi, request } from "../../services/apiClient";

const baseVulnerabilities = [
  {
    id: "VULN-001",
    code: "CWE-89",
    title: "SQL Injection",
    severity: "Critical",
    file: "src/controllers/authController.js",
    line: 24,
    status: "open",
    isFalsePositive: false,
    easySummary: "사용자 입력값이 SQL 명령문에 그대로 섞여 들어갈 수 있습니다.",
    scenario: "공격자가 로그인 입력값을 조작해 다른 사용자의 데이터에 접근할 수 있습니다.",
    remediation: [
      "문자열 결합 방식의 SQL 생성을 중단합니다.",
      "Prepared Statement 또는 ORM 파라미터 바인딩을 적용합니다.",
      "입력값 검증과 권한 검사를 함께 추가합니다.",
    ],
    trace: [
      "controller/apiGateway.handler: 사용자 입력 수집",
      "service/queryBuilder.internal: 쿼리 문자열 조립",
      "database/connector.executeRaw: 위험 Sink 호출",
    ],
  },
  {
    id: "VULN-002",
    code: "CWE-79",
    title: "Cross-site Scripting",
    severity: "High",
    file: "src/views/profile.jsx",
    line: 82,
    status: "false_positive",
    isFalsePositive: true,
    falsePositiveReason:
      "React 렌더링 escape와 보안 미들웨어가 활성화되어 실제 스크립트 실행 경로가 차단됩니다.",
    easySummary: "화면에 입력값이 표시되지만 현재 설정에서는 스크립트가 실행되지 않습니다.",
    scenario: "방어 설정이 꺼지면 사용자 브라우저에서 악성 스크립트가 실행될 수 있습니다.",
    remediation: ["현재 escape 설정과 보안 미들웨어를 유지합니다."],
    trace: ["profile.jsx: 사용자 입력 표시", "React DOM escape: HTML 실행 차단"],
  },
];

export async function startStaticAnalysis(payload) {
  if (!isMockApi()) {
    return request("/analysis/static", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  const scanId = `SCAN-${Math.floor(100 + Math.random() * 900)}`;
  return createMockResponse({
    scanId,
    stages: [
      {
        progress: 20,
        log: `[Func-02] ${payload.targetLanguage} 정적 분석 룰셋을 적용했습니다.`,
      },
      {
        progress: 50,
        log: "[Func-03] AI가 Source-to-Sink 경로를 추적했습니다.",
      },
      {
        progress: 80,
        log: "[Func-04] 실행 환경을 반영해 오탐 후보를 검토했습니다.",
      },
      {
        progress: 100,
        log: "[Func-08] 분석 결과와 리포트 데이터를 생성했습니다.",
      },
    ],
  });
}

export async function requestReScan(payload) {
  if (!isMockApi()) {
    return request(`/analysis/${payload.scanId}/rescan`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  return createMockResponse({
    scanId: payload.scanId,
    stages: [
      { progress: 35, log: "[Re-Scan] 변경된 파일을 우선 분석했습니다." },
      { progress: 75, log: "[Re-Scan] 패치된 경로의 Sink 도달 여부를 재검증했습니다." },
      { progress: 100, log: "[Re-Scan] 남은 취약점 지표를 갱신했습니다." },
    ],
  });
}

export async function getAnalysisDetail(scanId, { fixed = false } = {}) {
  if (!isMockApi()) return request(`/analysis/${scanId}`);

  const vulnerabilities = baseVulnerabilities.map((item) =>
    fixed && item.code === "CWE-89"
      ? { ...item, status: "resolved" }
      : item,
  );

  return createMockResponse({
    scanId,
    vulnerabilities,
    summary: {
      totalDetected: vulnerabilities.length,
      falsePositiveCount: vulnerabilities.filter((item) => item.isFalsePositive).length,
      resolvedCount: vulnerabilities.filter((item) => item.status === "resolved").length,
      openCount: vulnerabilities.filter((item) => item.status === "open").length,
    },
  });
}

export async function getFalsePositiveReview(scanId) {
  const detail = await getAnalysisDetail(scanId);
  return {
    scanId,
    items: detail.vulnerabilities.filter((item) => item.isFalsePositive),
  };
}
