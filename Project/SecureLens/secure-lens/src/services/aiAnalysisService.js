const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

function buildFallbackResult(vulnerability) {
  const file = vulnerability.filePath
    ? `${vulnerability.filePath}:${vulnerability.line}`
    : `line ${vulnerability.line}`;

  return {
    ...vulnerability,
    isExploitable: vulnerability.severity !== "LOW",
    attackPath: `${file} contains a risky pattern that may be reachable without enough validation or protection.`,
    reason: `${vulnerability.type} was detected by the static scanner and should be reviewed in the actual code flow.`,
    analysisLog:
      "Fallback analysis was used because the AI API key is missing or the AI response was unavailable.",
    fix:
      vulnerability.type === "SQL Injection"
        ? "Use prepared statements or ORM parameter binding."
        : "Validate input, replace unsafe APIs, and apply least-privilege boundaries.",
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
