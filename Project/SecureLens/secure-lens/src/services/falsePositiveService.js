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
            ? "No realistic attack path was confirmed during AI review."
            : "This looks low risk or appears to be test/demo code, so it was deprioritized.",
      };
    }

    return {
      ...item,
      status: "REAL",
      falseReason: "",
    };
  });
}
