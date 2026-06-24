const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

function buildFallbackResult(vulnerability) {
  const file = vulnerability.filePath ? `${vulnerability.filePath}:${vulnerability.line}` : `line ${vulnerability.line}`;

  return {
    ...vulnerability,
    isExploitable: vulnerability.severity !== "LOW",
    attackPath: `${file}에서 감지된 입력 또는 위험 함수가 보호 로직 없이 실행될 수 있습니다.`,
    reason: `${vulnerability.type} 패턴이 발견되어 실제 코드 흐름 검토가 필요합니다.`,
    analysisLog: "API 키가 없거나 AI 응답을 사용할 수 없어 규칙 기반 더미 분석을 사용했습니다.",
    fix:
      vulnerability.type === "SQL Injection"
        ? "Prepared Statement 또는 ORM 파라미터 바인딩을 사용하세요."
        : "입력값 검증, 안전한 API 대체, 권한 분리 적용을 검토하세요.",
  };
}

function extractJsonArray(content) {
  const start = content.indexOf("[");
  const end = content.lastIndexOf("]");

  if (start < 0 || end < start) return null;

  return content.slice(start, end + 1);
}

export async function runAIAnalysis(code, vulnerabilities) {
  if (!API_KEY) {
    return vulnerabilities.map(buildFallbackResult);
  }

  const prompt = `
You are SecureLens, an AI security analysis engine.

Source code:
${code || "Repository-wide scan. Use the static findings as primary evidence."}

Static analysis findings:
${JSON.stringify(vulnerabilities, null, 2)}

For each finding, decide whether it is realistically exploitable, explain the attack path, and provide a practical fix.
Return only a JSON array with this schema:
[
  {
    "type": "",
    "cwe": "",
    "filePath": "",
    "line": 0,
    "isExploitable": true,
    "severity": "",
    "attackPath": "",
    "reason": "",
    "analysisLog": "",
    "fix": ""
  }
]
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Return valid JSON only. Do not include markdown fences or prose outside the JSON array.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    return vulnerabilities.map(buildFallbackResult);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const json = extractJsonArray(content);

  try {
    return JSON.parse(json || content);
  } catch {
    return vulnerabilities.map(buildFallbackResult);
  }
}
