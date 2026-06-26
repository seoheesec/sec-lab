const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// API 키가 없거나 AI 요청이 실패했을 때도 앱이 멈추지 않도록
// 정적 분석 결과를 바탕으로 기본 설명을 만들어 주는 fallback 로직입니다.
function buildFallbackResult(vulnerability) {
  const file = vulnerability.filePath
    ? `${vulnerability.filePath}:${vulnerability.line}`
    : `line ${vulnerability.line}`;

  return {
    ...vulnerability,
    isExploitable: vulnerability.severity !== "LOW",
    source: vulnerability.source || "User-controlled input or external data",
    sink: vulnerability.sink || vulnerability.code || vulnerability.type,
    sanitization:
      vulnerability.sanitization ||
      "No clear validation, sanitization, encoding, or parameter binding was confirmed.",
    attackPath: `${file} 위치에서 입력값 검증이나 보호 로직이 부족하면 공격자가 악용할 수 있는 위험 패턴이 발견되었습니다.`,
    reason: `${vulnerability.type} 항목이 정적 분석에서 탐지되었으며 실제 코드 흐름에서 도달 가능한지 검토가 필요합니다.`,
    analysisLog:
      "AI 호출이 실패했거나 응답을 받을 수 없어 로컬 대체 분석 결과를 사용했습니다.",
    fix:
      vulnerability.type === "SQL Injection"
        ? "Prepared Statement 또는 ORM의 파라미터 바인딩을 사용하세요."
        : "입력값을 검증하고, 위험한 API 사용을 줄이며, 최소 권한 원칙을 적용하세요.",
  };
}

// AI 응답에 설명 문장이나 마크다운이 섞여 들어와도
// JSON 배열 부분만 최대한 안전하게 꺼내기 위한 보조 함수입니다.
function extractJsonArray(content) {
  const start = content.indexOf("[");
  const end = content.lastIndexOf("]");

  if (start < 0 || end < start) return null;

  return content.slice(start, end + 1);
}

// 정적 분석 결과를 AI에게 전달해 공격 가능성, 공격 경로, 수정 방법을 보강합니다.
// 실패 시에는 fallback 결과를 반환해서 사용자가 계속 대시보드를 볼 수 있게 합니다.
export async function runAIAnalysis(code, vulnerabilities) {
  if (vulnerabilities.length === 0) {
    return [];
  }

  if (!API_KEY) {
    return vulnerabilities.map(buildFallbackResult);
  }

  const prompt = `
You are SecureLens, an AI security analysis engine.

Source code:
${code || "Repository-wide scan. Use the static findings as primary evidence."}

Static analysis findings:
${JSON.stringify(vulnerabilities, null, 2)}

For each finding, perform source-to-sink security analysis:
1. Identify the source, meaning where untrusted input enters the code.
2. Identify the sink, meaning where that input is executed, rendered, queried, deserialized, or sent to a dangerous API.
3. Check whether validation, sanitization, encoding, parameter binding, or allow-listing blocks the flow.
4. Decide whether attacker-controlled input can realistically reach the sink.
5. Explain the attack path and provide a practical fix.
Return only a JSON array with this schema:
[
  {
    "type": "",
    "cwe": "",
    "filePath": "",
    "line": 0,
    "isExploitable": true,
    "severity": "",
    "source": "",
    "sink": "",
    "sanitization": "",
    "attackPath": "",
    "reason": "",
    "analysisLog": "",
    "fix": ""
  }
]
`;

  try {
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

    return JSON.parse(json || content);
  } catch {
    return vulnerabilities.map(buildFallbackResult);
  }
}
