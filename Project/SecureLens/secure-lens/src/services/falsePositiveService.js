export function runFalsePositiveReview(aiResults) {
  return aiResults.map((item) => {
    const isFalsePositive =
      item.isExploitable === false ||
      item.severity === "LOW" ||
      /test|mock|example|sample/i.test(item.filePath || "");

    if (isFalsePositive) {
      return {
        ...item,
        status: "FALSE_POSITIVE",
        falseReason:
          item.isExploitable === false
            ? "AI 분석에서 실제 공격 경로가 확인되지 않았습니다."
            : "낮은 위험도이거나 테스트/예제 코드로 추정되어 우선순위를 낮췄습니다.",
      };
    }

    return {
      ...item,
      status: "REAL",
      falseReason: "",
    };
  });
}
