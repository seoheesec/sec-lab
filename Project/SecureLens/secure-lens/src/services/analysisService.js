const rules = [
  {
    test: (line) => line.includes("eval("),
    type: "Dangerous Eval",
    cwe: "CWE-95",
    severity: "HIGH",
    description: "eval 사용으로 임의 코드 실행 위험이 있습니다.",
  },
  {
    test: (line) => line.includes("innerHTML"),
    type: "Cross Site Scripting (XSS)",
    cwe: "CWE-79",
    severity: "MEDIUM",
    description: "innerHTML 사용으로 스크립트 삽입 공격 가능성이 있습니다.",
  },
  {
    test: (line) => line.includes("document.write("),
    type: "Unsafe DOM Write",
    cwe: "CWE-79",
    severity: "MEDIUM",
    description: "document.write 사용은 XSS 취약점으로 이어질 수 있습니다.",
  },
  {
    test: (line) =>
      line.includes("localStorage.setItem") &&
      (line.toLowerCase().includes("token") ||
        line.toLowerCase().includes("password")),
    type: "Sensitive Data Storage",
    cwe: "CWE-922",
    severity: "LOW",
    description: "민감 정보가 localStorage에 저장될 수 있습니다.",
  },
  {
    test: (line) => line.includes("SELECT") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "사용자 입력이 SQL 쿼리에 직접 연결될 수 있습니다.",
  },
  {
    test: (line) => line.includes("query(") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "문자열 연결 방식의 SQL 쿼리가 감지되었습니다.",
  },
  {
    test: (line) => line.includes("exec("),
    type: "Python Exec Injection",
    cwe: "CWE-95",
    severity: "HIGH",
    description: "exec 사용으로 임의 코드 실행 가능성이 있습니다.",
  },
  {
    test: (line) => line.includes("pickle.loads"),
    type: "Unsafe Deserialization",
    cwe: "CWE-502",
    severity: "HIGH",
    description: "pickle.loads 사용은 역직렬화 공격 위험이 있습니다.",
  },
  {
    test: (line) => line.includes("os.system("),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "os.system 사용 시 명령어 삽입 공격이 가능할 수 있습니다.",
  },
  {
    test: (line) => line.includes("subprocess") && line.includes("shell=True"),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "shell=True 옵션 사용이 감지되었습니다.",
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
    description: "사용자 입력 기반 파일 포함이 감지되었습니다.",
  },
  {
    test: (line) => line.includes("gets("),
    type: "Buffer Overflow",
    cwe: "CWE-120",
    severity: "HIGH",
    description: "gets 함수는 버퍼 오버플로 위험이 있습니다.",
  },
  {
    test: (line) => line.includes("strcpy("),
    type: "Buffer Overflow",
    cwe: "CWE-120",
    severity: "MEDIUM",
    description: "strcpy 사용 시 버퍼 크기 검증이 필요합니다.",
  },
  {
    test: (line) => line.includes("sprintf("),
    type: "Unsafe Formatting",
    cwe: "CWE-120",
    severity: "MEDIUM",
    description: "sprintf 사용 시 버퍼 오버플로 위험이 있습니다.",
  },
  {
    test: (line) => line.includes("Runtime.getRuntime().exec"),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "Runtime.exec 사용이 감지되었습니다.",
  },
  {
    test: (line) => line.includes("Statement") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "동적 SQL 생성이 감지되었습니다.",
  },
  {
    test: (line) => line.includes("password =") || line.includes("PASSWORD ="),
    type: "Hardcoded Secret",
    cwe: "CWE-798",
    severity: "LOW",
    description: "비밀번호가 코드에 하드코딩되어 있을 수 있습니다.",
  },
  {
    test: (line) => line.includes("api_key") || line.includes("API_KEY"),
    type: "Hardcoded API Key",
    cwe: "CWE-798",
    severity: "MEDIUM",
    description: "API Key가 코드에 포함되어 있을 수 있습니다.",
  },
];

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
    severityCounts,
    scanDuration,
    scannedFiles: files.length,
  };
}
