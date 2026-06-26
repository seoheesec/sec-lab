export function normalizeSeverity(severity = "") {
  return String(severity).toUpperCase();
}

function normalizeBoolean(value) {
  if (value === false) return false;
  if (value === true) return true;
  if (typeof value === "string") {
    return value.toLowerCase() !== "false";
  }

  return Boolean(value);
}

export function isRealFinding(item) {
  return item.status === "REAL";
}

export function isFalsePositiveFinding(item) {
  return item.status === "FALSE_POSITIVE";
}

// AI 분석 결과를 최종 취약점과 오탐으로 나누는 규칙입니다.
// 발표에서는 "탐지 수를 많이 보여주는 것보다 조치 가능한 항목만 남기는 단계"라고 설명하면 됩니다.
export function runFalsePositiveReview(aiResults) {
  return aiResults.map((item) => {
    const severity = normalizeSeverity(item.severity);
    const isExploitable = normalizeBoolean(item.isExploitable);
    // 실제 악용 가능성이 낮거나, LOW 위험도이거나,
    // 테스트/샘플 파일에서 나온 결과는 오탐 가능성이 높다고 봅니다.
    const isFalsePositive =
      isExploitable === false ||
      severity === "LOW" ||
      /test|mock|example|sample/i.test(item.filePath || "");

    if (isFalsePositive) {
      return {
        ...item,
        severity,
        isExploitable,
        status: "FALSE_POSITIVE",
        falseReason:
          isExploitable === false
            ? "AI 검토에서 실제 공격 경로가 확인되지 않아 오탐으로 분류했습니다."
            : "위험도가 낮거나 테스트/예제 코드로 보여 최종 취약점에서 제외했습니다.",
      };
    }

    return {
      ...item,
      severity,
      isExploitable,
      status: "REAL",
      falseReason: "",
    };
  });
}
