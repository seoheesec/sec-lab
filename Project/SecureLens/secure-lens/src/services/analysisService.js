const rules = [
  {
    test: (line) => line.includes("eval("),
    type: "Dangerous Eval",
    cwe: "CWE-95",
    severity: "HIGH",
    description: "Use of eval can allow arbitrary code execution.",
  },
  {
    test: (line) => line.includes("innerHTML"),
    type: "Cross Site Scripting (XSS)",
    cwe: "CWE-79",
    severity: "MEDIUM",
    description: "innerHTML can enable script injection when it receives untrusted input.",
  },
  {
    test: (line) => line.includes("document.write("),
    type: "Unsafe DOM Write",
    cwe: "CWE-79",
    severity: "MEDIUM",
    description: "document.write can introduce unsafe DOM injection paths.",
  },
  {
    test: (line) =>
      line.includes("localStorage.setItem") &&
      (line.toLowerCase().includes("token") ||
        line.toLowerCase().includes("password")),
    type: "Sensitive Data Storage",
    cwe: "CWE-922",
    severity: "LOW",
    description: "Sensitive values may be stored in localStorage.",
  },
  {
    test: (line) => line.includes("SELECT") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "User-controlled data may be concatenated into a SQL query.",
  },
  {
    test: (line) => line.includes("query(") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "A SQL query appears to be built with string concatenation.",
  },
  {
    test: (line) => line.includes("exec("),
    type: "Python Exec Injection",
    cwe: "CWE-95",
    severity: "HIGH",
    description: "Python exec can execute attacker-controlled code.",
  },
  {
    test: (line) => line.includes("pickle.loads"),
    type: "Unsafe Deserialization",
    cwe: "CWE-502",
    severity: "HIGH",
    description: "pickle.loads can execute code during unsafe deserialization.",
  },
  {
    test: (line) => line.includes("os.system("),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "os.system may execute attacker-controlled operating system commands.",
  },
  {
    test: (line) => line.includes("subprocess") && line.includes("shell=True"),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "subprocess with shell=True can expose command injection paths.",
  },
  {
    test: (line) => line.includes("mysql_query("),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "mysql_query usage requires strict validation and parameter binding.",
  },
  {
    test: (line) => line.includes("include($_GET"),
    type: "Local File Inclusion",
    cwe: "CWE-98",
    severity: "HIGH",
    description: "User-controlled file inclusion can expose local files or execute code.",
  },
  {
    test: (line) => line.includes("gets("),
    type: "Buffer Overflow",
    cwe: "CWE-120",
    severity: "HIGH",
    description: "gets is unsafe and can lead to buffer overflow.",
  },
  {
    test: (line) => line.includes("strcpy("),
    type: "Buffer Overflow",
    cwe: "CWE-120",
    severity: "MEDIUM",
    description: "strcpy requires careful bounds checking to avoid buffer overflow.",
  },
  {
    test: (line) => line.includes("sprintf("),
    type: "Unsafe Formatting",
    cwe: "CWE-120",
    severity: "MEDIUM",
    description: "sprintf can overflow buffers when output size is not constrained.",
  },
  {
    test: (line) => line.includes("Runtime.getRuntime().exec"),
    type: "Command Injection",
    cwe: "CWE-77",
    severity: "HIGH",
    description: "Runtime.exec may execute attacker-controlled commands.",
  },
  {
    test: (line) => line.includes("Statement") && line.includes("+"),
    type: "SQL Injection",
    cwe: "CWE-89",
    severity: "HIGH",
    description: "Dynamic SQL construction was detected.",
  },
  {
    test: (line) => line.includes("password =") || line.includes("PASSWORD ="),
    type: "Hardcoded Secret",
    cwe: "CWE-798",
    severity: "LOW",
    description: "A password-like value appears to be hardcoded.",
  },
  {
    test: (line) => line.includes("api_key") || line.includes("API_KEY"),
    type: "Hardcoded API Key",
    cwe: "CWE-798",
    severity: "MEDIUM",
    description: "An API key appears to be hardcoded.",
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
