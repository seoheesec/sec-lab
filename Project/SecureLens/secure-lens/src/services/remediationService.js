function getOriginalCode(vulnerability) {
  return vulnerability.code || "// 탐지된 코드 라인을 확인할 수 없습니다.";
}

const remediationByType = {
  "SQL Injection": {
    fixedCode:
      'cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))\n# 입력값은 SQL 코드가 아니라 데이터로만 처리됩니다.',
    explanation:
      "? placeholder와 파라미터 바인딩을 사용하면 사용자가 어떤 값을 넣어도 SQL 문법으로 실행되지 않고 안전한 데이터로 처리됩니다.",
  },
  "Command Injection": {
    fixedCode:
      'allowed_commands = {"status": ["systemctl", "status", "app"]}\ncommand = request.args.get("cmd")\nsubprocess.run(allowed_commands[command], check=True)',
    explanation:
      "사용자 입력을 운영체제 명령 문자열에 직접 붙이지 않고, 허용된 명령만 목록에서 선택하게 만들어 명령어 삽입을 막습니다.",
  },
  "Python Exec Injection": {
    fixedCode:
      'allowed_actions = {"health_check": health_check}\naction = request.args.get("action")\nresult = allowed_actions[action]()',
    explanation:
      "exec로 문자열을 코드처럼 실행하지 않고, 미리 허용한 함수만 호출하도록 바꾸면 임의 코드 실행을 막을 수 있습니다.",
  },
  "Unsafe Deserialization": {
    fixedCode:
      "import json\npayload = request.get_data(as_text=True)\ndata = json.loads(payload)\nvalidate_payload(data)",
    explanation:
      "pickle은 객체 복원 과정에서 코드 실행 위험이 있으므로, 신뢰할 수 없는 입력에는 JSON처럼 단순한 데이터 포맷을 사용하고 스키마를 검증합니다.",
  },
  "Hardcoded API Key": {
    fixedCode:
      'import os\napi_key = os.environ.get("SERVICE_API_KEY")\nif not api_key:\n    raise RuntimeError("SERVICE_API_KEY is required")',
    explanation:
      "API 키를 코드에 직접 적지 않고 환경 변수에서 읽으면 GitHub에 키가 노출되는 사고를 줄일 수 있습니다.",
  },
  "Hardcoded Secret": {
    fixedCode:
      'import os\npassword = os.environ.get("APP_PASSWORD")\nif not password:\n    raise RuntimeError("APP_PASSWORD is required")',
    explanation:
      "비밀번호를 코드에서 분리해 환경 변수나 Secret Manager에 저장하면 소스코드 유출 시 인증 정보가 함께 노출되지 않습니다.",
  },
  "Dangerous Eval": {
    fixedCode:
      'handlers = {"sum": lambda values: sum(values)}\naction = request.json.get("action")\nresult = handlers[action](request.json.get("values", []))',
    explanation:
      "eval 대신 허용된 동작만 명시적으로 매핑하면 사용자가 입력한 문자열이 코드로 실행되는 일을 막을 수 있습니다.",
  },
  "Cross Site Scripting (XSS)": {
    fixedCode:
      "element.textContent = userInput;\n// HTML이 필요하다면 DOMPurify 같은 검증된 정화 라이브러리를 사용합니다.",
    explanation:
      "innerHTML 대신 textContent를 사용하면 입력값이 HTML이나 스크립트로 해석되지 않아 XSS 위험을 줄일 수 있습니다.",
  },
  "Unsafe DOM Write": {
    fixedCode:
      "const safeNode = document.createTextNode(userInput);\ncontainer.replaceChildren(safeNode);",
    explanation:
      "document.write처럼 문서를 직접 덮어쓰는 방식 대신 텍스트 노드를 사용하면 스크립트 삽입 가능성을 낮출 수 있습니다.",
  },
  "Sensitive Data Storage": {
    fixedCode:
      "// 토큰은 가능하면 HttpOnly Secure 쿠키로 서버에서 설정합니다.\n// 클라이언트에는 만료 시간이 짧은 비민감 상태만 저장합니다.",
    explanation:
      "localStorage는 JavaScript에서 접근 가능하므로 XSS가 발생하면 토큰이 탈취될 수 있습니다. 민감 정보는 HttpOnly 쿠키나 서버 측 세션을 우선 검토하세요.",
  },
  "Local File Inclusion": {
    fixedCode:
      'allowed_pages = {"home": "pages/home.php", "help": "pages/help.php"}\n$page = allowed_pages[$_GET["page"]] ?? "pages/home.php";\ninclude $page;',
    explanation:
      "사용자 입력을 파일 경로로 직접 사용하지 않고 허용 목록에서만 파일을 선택하면 임의 파일 포함을 막을 수 있습니다.",
  },
  "Buffer Overflow": {
    fixedCode:
      "fgets(buffer, sizeof(buffer), stdin);\n// 입력 길이를 버퍼 크기 안으로 제한합니다.",
    explanation:
      "길이 제한이 없는 함수 대신 버퍼 크기를 함께 받는 안전한 함수를 사용하면 메모리 초과 쓰기를 줄일 수 있습니다.",
  },
  "Unsafe Formatting": {
    fixedCode:
      'snprintf(buffer, sizeof(buffer), "%s", user_input);',
    explanation:
      "출력 가능한 최대 길이를 제한하면 긴 입력이 버퍼를 넘어가는 문제를 막을 수 있습니다.",
  },
};

export function buildRemediation(vulnerability) {
  const template = remediationByType[vulnerability.type] || {
    fixedCode:
      "// 입력값 검증, 권한 제한, 안전한 API 사용을 적용해 취약한 코드를 수정하세요.",
    explanation:
      "취약점 유형과 코드 흐름을 확인한 뒤, 입력값 검증과 안전한 API 사용을 우선 적용하는 것이 좋습니다.",
  };

  return {
    originalCode: getOriginalCode(vulnerability),
    fixedCode: template.fixedCode,
    explanation: template.explanation,
  };
}
