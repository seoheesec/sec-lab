const LANGUAGE_BY_EXTENSION = {
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".py": "Python",
  ".php": "PHP",
  ".java": "Java",
  ".c": "C",
  ".cpp": "C++",
  ".h": "C/C++ Header",
  ".hpp": "C++ Header",
};

// 정적 분석 규칙 목록입니다.
// 각 규칙은 한 줄의 코드가 특정 위험 패턴을 포함하는지 검사하고,
// 탐지되면 취약점 유형, CWE, 위험도, 설명을 결과에 담습니다.
const rules = [
  {
    test: (line) => line.includes("eval("),
    type: "Dangerous Eval",
    cwe: "CWE-95",
    severity: "HIGH",
    description: "eval 사용은 공격자가 임의의 코드를 실행하게 만들 수 있습니다.",
  },
  {
    test: (line) => line.includes("innerHTML"),
    type: "Cross Site Scripting (XSS)",
    cwe: "CWE-79",
    severity: "MEDIUM",
    description:
      "innerHTML에 검증되지 않은 입력이 들어가면 스크립트 삽입 공격이 가능할 수 있습니다.",
  },
  {
    test: (line) => line.includes("document.write("),
    type: "Unsafe DOM Write",
    cwe: "CWE-79",
    severity: "MEDIUM",
    description: "document.write는 안전하지 않은 DOM 삽입 경로를 만들 수 있습니다.",
  },
  {
    test: (line) =>
      line.includes("localStorage.setItem") &&
      (line.toLowerCase().includes("token") ||
        line.toLowerCase().includes("password")),
    type: "Sensitive Data Storage",
    cwe: "CWE-922",
    severity: "LOW",
    description: "토큰이나 비밀번호 같은 민감 정보가 localStorage에 저장될 수 있습니다.",
  },
  {
    test: (line) => line.includes("SELECT") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description:
      "사용자 입력이 SQL 쿼리에 직접 이어 붙여져 SQL Injection 위험이 있습니다.",
  },
  {
    test: (line) => line.includes("query(") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "문자열 연결 방식으로 SQL 쿼리를 만드는 코드가 감지되었습니다.",
  },
  {
    test: (line) => line.includes("exec("),
    type: "Python Exec Injection",
    cwe: "CWE-95",
    severity: "HIGH",
    description: "Python exec는 공격자가 조작한 코드를 실행하게 만들 수 있습니다.",
  },
  {
    test: (line) => line.includes("pickle.loads"),
    type: "Unsafe Deserialization",
    cwe: "CWE-502",
    severity: "HIGH",
    description:
      "pickle.loads는 안전하지 않은 역직렬화 과정에서 코드 실행 위험을 만들 수 있습니다.",
  },
  {
    test: (line) => line.includes("os.system("),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description:
      "os.system은 공격자가 조작한 운영체제 명령을 실행하게 만들 수 있습니다.",
  },
  {
    test: (line) => line.includes("subprocess") && line.includes("shell=True"),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description:
      "shell=True 옵션을 사용한 subprocess 호출은 명령어 삽입 공격 경로가 될 수 있습니다.",
  },
  {
    test: (line) => line.includes("mysql_query("),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "mysql_query 사용 시 입력값 검증과 파라미터 바인딩이 필요합니다.",
  },
  {
    test: (line) => line.includes("include($_GET"),
    type: "Local File Inclusion",
    cwe: "CWE-98",
    severity: "HIGH",
    description:
      "사용자 입력으로 파일을 include하면 로컬 파일 노출이나 코드 실행 위험이 생길 수 있습니다.",
  },
  {
    test: (line) => line.includes("gets("),
    type: "Buffer Overflow",
    cwe: "CWE-120",
    severity: "HIGH",
    description:
      "gets 함수는 입력 길이를 제한하지 않아 버퍼 오버플로로 이어질 수 있습니다.",
  },
  {
    test: (line) => line.includes("strcpy("),
    type: "Buffer Overflow",
    cwe: "CWE-120",
    severity: "MEDIUM",
    description: "strcpy 사용 시 버퍼 크기 검증이 없으면 오버플로가 발생할 수 있습니다.",
  },
  {
    test: (line) => line.includes("sprintf("),
    type: "Unsafe Formatting",
    cwe: "CWE-120",
    severity: "MEDIUM",
    description: "sprintf는 출력 길이를 제한하지 않으면 버퍼를 초과할 수 있습니다.",
  },
  {
    test: (line) => line.includes("Runtime.getRuntime().exec"),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "Runtime.exec는 공격자가 조작한 명령을 실행하게 만들 수 있습니다.",
  },
  {
    test: (line) => line.includes("Statement") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "동적으로 SQL을 생성하는 코드가 감지되었습니다.",
  },
  {
    test: (line) => line.includes("password =") || line.includes("PASSWORD ="),
    type: "Hardcoded Secret",
    cwe: "CWE-798",
    severity: "LOW",
    description: "비밀번호로 보이는 값이 코드에 직접 하드코딩되어 있습니다.",
  },
  {
    test: (line) => line.includes("api_key") || line.includes("API_KEY"),
    type: "Hardcoded API Key",
    cwe: "CWE-798",
    severity: "MEDIUM",
    description: "API 키로 보이는 값이 코드에 직접 포함되어 있습니다.",
  },
];

export function detectLanguageFromPath(path = "") {
  const lowerPath = path.toLowerCase();
  const extension = Object.keys(LANGUAGE_BY_EXTENSION).find((item) =>
    lowerPath.endsWith(item),
  );

  return extension ? LANGUAGE_BY_EXTENSION[extension] : "Unknown";
}

function summarizeLanguages(files) {
  const counts = files.reduce((result, file) => {
    const language = detectLanguageFromPath(file.path || file.name);

    if (language === "Unknown") return result;

    return {
      ...result,
      [language]: (result[language] || 0) + 1,
    };
  }, {});
  const languages = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (languages.length === 0) return "Unknown";
  if (languages.length === 1) return languages[0][0];

  return `${languages[0][0]} 중심 Mixed`;
}

// 코드 문자열 하나를 줄 단위로 검사합니다.
// 예: 사용자가 에디터에 붙여넣은 코드, 또는 GitHub에서 가져온 파일 내용.
export function analyzeCode(code, metadata = {}) {
  const results = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    rules.forEach((rule) => {
      if (!rule.test(line)) return;

      results.push({
        type: rule.type,
        cwe: rule.cwe,
        severity: rule.severity,
        description: rule.description,
        line: index + 1,
        code: line.trim(),
        ...metadata,
      });
    });
  });

  return results;
}

export function runStaticAnalysis(code) {
  return analyzeCode(code);
}

// 여러 파일을 한 번에 검사할 때 사용하는 함수입니다.
// 폴더 업로드나 GitHub 저장소 전체 분석에서는 파일 배열을 받아
// 모든 취약점, 주 사용 언어, 위험도 통계, 검사 시간을 함께 계산합니다.
export function analyzeFiles(files) {
  const startedAt = performance.now();
  const vulnerabilities = files.flatMap((file) =>
    analyzeCode(file.content, {
      filePath: file.path,
      fileName: file.name || file.path.split("/").pop(),
    }),
  );
  const scanDuration = Number(((performance.now() - startedAt) / 1000).toFixed(2));
  const severityCounts = vulnerabilities.reduce(
    (counts, item) => ({
      ...counts,
      [item.severity]: (counts[item.severity] || 0) + 1,
    }),
    { HIGH: 0, MEDIUM: 0, LOW: 0 },
  );

  return {
    vulnerabilities,
    language: summarizeLanguages(files),
    severityCounts,
    scanDuration,
    scannedFiles: files.length,
  };
}
