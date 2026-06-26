# SecureLens 코드 발표 대비 해설서

이 문서는 발표 중에 교수님이 "이 코드는 왜 썼나요?", "이 기능은 어떻게 동작하나요?"라고 물어봤을 때 바로 답할 수 있도록 정리한 설명서입니다.

## 1. 한 문장으로 설명하기

SecureLens는 사용자가 코드를 직접 붙여넣거나 GitHub 저장소를 연결하면, 프론트엔드에서 정적 분석, AI 분석, 오탐 검토, 리포트 생성, 분석 이력 관리를 순서대로 수행하는 보안 취약점 분석 웹 서비스입니다.

이 프로젝트의 중요한 특징은 백엔드와 DB 없이 React와 LocalStorage만으로 로그인, 분석 결과 저장, 통계, 히스토리까지 처리한다는 점입니다.

## 2. 전체 구조

```text
src/
  App.jsx                         라우팅과 로그인 보호 처리
  main.jsx                        React 앱 시작점
  theme.js                        다크모드/푸른색 기반 MUI 테마
  components/                     여러 화면에서 재사용하는 UI 컴포넌트
  pages/                          실제 화면 단위 컴포넌트
  services/                       인증, 저장, 분석, GitHub, 리포트용 핵심 로직
  data/demoVulnerableCode.js      시연용 취약 코드 샘플
```

발표 답변:

> 화면은 `pages`에, 반복되는 UI는 `components`에, 실제 데이터 처리 로직은 `services`에 분리했습니다. 이렇게 나누면 화면 디자인과 핵심 로직을 따로 관리할 수 있어서 유지보수가 쉬워집니다.

## 3. 왜 React를 썼는가

React는 화면을 컴포넌트 단위로 나누기 좋고, 상태가 바뀌면 화면을 자동으로 다시 그려줍니다. SecureLens는 로그인 여부, 분석 단계, 취약점 목록, 오탐 결과, 히스토리처럼 계속 바뀌는 데이터가 많기 때문에 React 구조가 잘 맞습니다.

발표 답변:

> 분석 결과가 바뀔 때마다 대시보드, 마이페이지, 리포트 화면이 함께 갱신되어야 해서 상태 기반 UI를 만들기 쉬운 React를 사용했습니다.

## 4. App.jsx: 라우팅과 Protected Route

위치: `src/App.jsx`

`App.jsx`는 사용자가 어떤 주소로 들어왔을 때 어떤 화면을 보여줄지 결정합니다.

중요한 함수는 `ProtectedApp`입니다.

```jsx
function ProtectedApp({ children }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}
```

동작 방식:

1. LocalStorage에서 로그인 세션을 가져옵니다.
2. 세션이 없으면 로그인 화면으로 보냅니다.
3. 세션이 있으면 사이드바가 있는 실제 서비스 화면을 보여줍니다.

왜 썼는가:

> 로그인하지 않은 사용자가 대시보드나 분석 화면에 직접 접근하지 못하게 하기 위해 사용했습니다. 그래서 로그인 전에는 `/login`, `/signup`만 볼 수 있고, 로그인 후에만 분석 기능을 사용할 수 있습니다.

예상 질문:

Q. 왜 로그인 화면에는 사이드바가 없나요?

A. 로그인 전 사용자는 아직 서비스를 사용할 권한이 없기 때문에, 기능 메뉴를 먼저 보여주면 UX와 보안 흐름이 어색합니다. 그래서 로그인 후에만 `AppLayout`으로 사이드바를 감싸도록 했습니다.

## 5. AppLayout: 공통 레이아웃

위치: `src/components/AppLayout.jsx`

로그인 후 보이는 사이드바, 로그아웃 버튼, 주요 메뉴 구조를 담당합니다.

왜 컴포넌트로 분리했는가:

> 대시보드, 정적 분석, AI 분석, 오탐 검토, 리포트, 마이페이지가 모두 같은 레이아웃을 사용하기 때문에 공통 컴포넌트로 만들었습니다. 이렇게 하면 메뉴 디자인을 한 번만 수정해도 전체 화면에 반영됩니다.

## 6. 인증 로직

위치: `src/services/authService.js`

인증 관련 핵심 함수:

- `signUp`: 회원가입
- `login`: 로그인
- `ensureDemoAdmin`: 시연용 admin 계정 생성
- `deleteCurrentAccount`: 계정 삭제
- `hashPassword`: 비밀번호 해시 처리

### 6.1 비밀번호를 그대로 저장하지 않는 이유

회원가입 시 비밀번호를 그대로 LocalStorage에 저장하지 않고 PBKDF2 해시로 변환합니다.

```js
const bits = await crypto.subtle.deriveBits(
  {
    name: "PBKDF2",
    salt: saltBytes,
    iterations: 120000,
    hash: "SHA-256",
  },
  key,
  256,
);
```

왜 썼는가:

> 비밀번호 원문을 저장하면 LocalStorage가 노출됐을 때 바로 계정 정보가 유출됩니다. 그래서 비밀번호를 복원하기 어려운 해시값으로 바꿔 저장했습니다.

주의할 점:

> 다만 이 프로젝트는 프론트엔드 전용 시연 프로젝트라서 실제 서비스 수준의 보안은 아닙니다. 실제 서비스에서는 서버에서 비밀번호를 검증하고, 세션도 서버가 관리해야 합니다.

### 6.2 salt를 쓰는 이유

salt는 사용자마다 다르게 붙이는 랜덤 값입니다.

```js
const salt = crypto.getRandomValues(new Uint8Array(16));
```

왜 썼는가:

> 같은 비밀번호를 가진 사용자가 있어도 salt가 다르면 해시 결과가 달라집니다. 그래서 해시값만 보고 같은 비밀번호인지 추측하기 어렵게 만듭니다.

### 6.3 crypto.randomUUID()는 무엇인가

로그인 성공 시 세션 토큰을 만들 때 사용합니다.

```js
const session = {
  token: crypto.randomUUID(),
  user: {
    id: user.id,
    email: user.email,
  },
  createdAt: new Date().toISOString(),
};
```

`crypto.randomUUID()`는 브라우저가 제공하는 Web Crypto API 기능입니다. 랜덤한 고유 ID를 만들어줍니다.

왜 썼는가:

> 로그인 세션마다 겹치지 않는 토큰이 필요해서 사용했습니다. 직접 랜덤 문자열을 만드는 것보다 브라우저 표준 보안 API를 쓰는 편이 안전하고 간단합니다.

### 6.4 로그인 5회 실패 잠금

로그인 실패 횟수를 저장하고, 5회 이상 실패하면 5분 동안 잠급니다.

왜 썼는가:

> 무작위로 비밀번호를 계속 시도하는 공격을 줄이기 위한 기본적인 보호 장치입니다.

발표 답변:

> 프론트엔드 전용 프로젝트라 완벽한 방어는 아니지만, 로그인 실패 횟수와 잠금 시간을 저장해서 계정 보호 흐름을 구현했습니다.

## 7. LocalStorage 저장 구조

위치: `src/services/storageService.js`

이 프로젝트는 백엔드와 DB 없이 동작해야 하므로 브라우저의 LocalStorage를 사용합니다.

저장되는 데이터:

- 사용자 목록
- 현재 로그인 세션
- 현재 프로젝트 정보
- 정적 분석 결과
- AI 분석 결과
- 오탐 검토 결과
- 분석 히스토리
- GitHub Connect 상태
- 오탐 신고 내역

### 7.1 사용자별 데이터 분리

중요한 부분은 분석 데이터에 사용자 ID를 붙여 저장한다는 점입니다.

예시:

```text
secureLensScanHistory:admin
secureLensScanHistory:user1
```

왜 썼는가:

> admin으로 분석한 기록이 새로 가입한 사용자에게 보이면 안 됩니다. 그래서 분석 결과와 히스토리는 로그인한 사용자별로 따로 저장되게 했습니다.

발표 답변:

> 사용자 계정은 공통으로 관리하지만, 분석 결과는 개인정보처럼 사용자별 데이터이므로 계정 ID를 붙여 분리했습니다.

### 7.2 저장 후 화면 갱신 이벤트

저장 함수는 데이터를 저장한 뒤 커스텀 이벤트를 발생시킵니다.

```js
window.dispatchEvent(
  new CustomEvent(SECURE_LENS_STORAGE_EVENT, {
    detail: { key, storageKey },
  }),
);
```

왜 썼는가:

> LocalStorage는 React 상태처럼 자동으로 화면을 다시 그려주지 않습니다. 그래서 저장이 일어났다는 이벤트를 직접 보내서 대시보드나 마이페이지가 새 데이터를 읽도록 했습니다.

## 8. 정적 분석 로직

위치: `src/services/analysisService.js`

정적 분석은 코드를 실행하지 않고 문자열과 패턴을 검사해서 위험한 코드 사용을 찾습니다.

탐지 예시:

- `eval`
- `innerHTML`
- `document.write`
- 하드코딩된 API 키
- SQL 문자열 결합
- Python `exec`
- Python `pickle.loads`
- Python `os.system`
- Python `subprocess`의 `shell=True`
- C의 `gets`, `strcpy`
- Java의 `Runtime.exec`

왜 정적 분석을 먼저 하는가:

> 정적 분석은 빠르고 비용이 적게 듭니다. 먼저 규칙 기반으로 의심 코드를 찾고, 그 결과를 AI 분석으로 넘기면 전체 분석 흐름이 더 효율적입니다.

예상 질문:

Q. 정적 분석은 정확한가요?

A. 정적 분석은 빠르지만 문맥을 완전히 이해하지 못해서 오탐이 생길 수 있습니다. 그래서 뒤에서 AI 분석과 오탐 검토 단계를 추가했습니다.

## 9. StaticAnalysis 화면

위치: `src/pages/StaticAnalysis.jsx`

이 화면은 사용자가 코드를 직접 붙여넣거나 파일, 폴더를 업로드해서 분석하는 화면입니다.

사용한 주요 기술:

- Monaco Editor
- 파일 업로드
- 폴더 업로드
- 언어 자동 감지
- 분석 결과 저장

### 9.1 Monaco Editor를 쓴 이유

Monaco Editor는 VS Code에서 사용하는 코드 에디터 기반 라이브러리입니다.

왜 썼는가:

> 보안 분석 서비스는 개발자가 코드를 읽고 붙여넣는 화면이 중요합니다. 일반 textarea보다 줄 번호, 문법 강조, 코드 편집 경험이 좋아서 Monaco Editor를 사용했습니다.

발표 답변:

> 사용자가 분석 전에 코드를 확인할 수 있어야 하므로 개발자에게 익숙한 에디터 환경을 제공했습니다.

## 10. AI 분석 로직: Source-to-Sink 흐름 분석

위치: `src/services/aiAnalysisService.js`

AI 분석은 단순히 취약점 이름을 설명하는 단계가 아니라, **입력값이 들어오는 지점(source)에서 위험한 실행 지점(sink)까지 어떻게 흘러가는지**를 보고 실제 공격 가능성을 판단하는 단계입니다.

쉽게 말하면 다음을 확인합니다.

```text
사용자 입력(source)
  -> 중간 처리 과정
  -> 검증/필터링/sanitizing 여부
  -> 위험한 함수나 출력 지점(sink)
```

예를 들어 SQL Injection이라면 다음 흐름을 봅니다.

```text
request.args.get("id")
  -> SQL 문자열에 그대로 연결됨
  -> cursor.execute(query)
```

이 흐름에서 입력값이 파라미터화된 쿼리나 검증 과정을 거치지 않고 DB 실행 지점까지 도달하면 실제 취약점 가능성이 높다고 판단합니다.

흐름:

1. 정적 분석 결과를 가져옵니다.
2. AI에게 각 취약점의 source, sink, sanitization 여부를 확인하게 합니다.
3. 입력값이 sink까지 도달하는 공격 경로를 설명하게 합니다.
4. API 키가 없거나 요청이 실패하면 fallback 결과를 사용합니다.

왜 AI 분석이 필요한가:

> 정적 분석은 위험한 함수 사용 자체를 잘 찾지만, 그 값이 실제 사용자 입력에서 왔는지, 중간에 검증되었는지까지 정확히 판단하기 어렵습니다. AI 분석은 코드 흐름을 읽어서 source에서 sink까지 이어지는 공격 경로가 있는지 확인하는 역할을 합니다.

발표 답변:

> AI 분석은 정적 분석 결과를 받아서 입력 지점과 출력 또는 실행 지점을 연결해 봅니다. 사용자의 입력값이 검증 없이 `eval`, SQL 실행, 명령어 실행 같은 sink로 들어가면 실제 공격 가능성이 높다고 판단합니다.

왜 fallback이 필요한가:

> 발표나 시연 중 API 오류가 나면 전체 서비스가 멈추면 안 됩니다. 그래서 API 키가 없거나 네트워크 문제가 있어도 기본 분석 결과로 다음 단계가 진행되게 했습니다.

발표 답변:

> 실제 서비스라면 서버에서 AI API를 호출해야 하지만, 이번 프로젝트는 프론트엔드 중심 시연이기 때문에 API 실패 시에도 UX가 끊기지 않도록 fallback을 넣었습니다. 다만 핵심 의도는 source-to-sink 흐름을 보고 실제 악용 가능성을 판단하는 것입니다.

주의할 점:

> 실제 운영 서비스에서는 API 키를 프론트엔드에 두면 안 됩니다. 사용자가 개발자 도구로 볼 수 있기 때문입니다. 운영 환경에서는 백엔드 서버가 API 키를 안전하게 보관해야 합니다.

## 11. 오탐 검토 로직

위치: `src/services/falsePositiveService.js`

AI 분석 결과를 다시 검토해서 실제 조치가 필요한 취약점과 오탐 가능성이 높은 항목을 분리합니다.

오탐으로 보는 기준:

- AI가 실제 공격 가능성이 낮다고 판단한 경우
- 위험도가 Low인 경우
- 테스트, mock, sample, example 경로에 있는 코드인 경우

왜 필요한가:

> 보안 도구는 취약점을 많이 찾는 것도 중요하지만, 실제로 고쳐야 하는 항목을 구분하는 것이 더 중요합니다. 오탐이 너무 많으면 개발자가 중요한 취약점을 놓칠 수 있습니다.

발표 답변:

> 정적 분석은 의심 코드를 넓게 잡고, AI와 오탐 검토 단계에서 실제 조치가 필요한 취약점만 남기는 구조입니다.

## 12. 오탐 신고 기능

관련 위치:

- `src/components/VulnerabilityDetailDialog.jsx`
- `src/services/storageService.js`

사용자가 취약점 카드를 열고 "오탐 신고"를 누르면 해당 취약점에 대한 피드백이 LocalStorage에 저장됩니다.

중요한 점:

> 취약점 하나를 신고했을 때 다른 취약점까지 신고 완료로 보이면 안 되기 때문에, 파일 경로, 줄 번호, 취약점 종류, 코드 일부 등을 조합해서 고유 ID를 만듭니다.

왜 썼는가:

> 실제 서비스에서는 이 피드백을 백엔드로 보내 AI 모델 개선에 활용할 수 있습니다. 현재는 백엔드가 없으므로 LocalStorage에 저장해 시연 흐름을 구현했습니다.

## 13. GitHub Connect 로직

관련 위치:

- `src/pages/GithubConnect.jsx`
- `src/services/githubService.js`

GitHub Connect는 저장소 URL을 입력하면 GitHub API로 파일 목록을 가져오고, 분석 가능한 파일을 읽어서 전체 워크플로우를 실행합니다.

워크플로우:

```text
GitHub 저장소 연결
  -> 파일 목록 가져오기
  -> 정적 분석
  -> AI 분석
  -> 오탐 검토
  -> 리포트 준비
```

왜 단계형 워크플로우로 만들었는가:

> 사용자가 지금 분석이 어디까지 진행됐는지 알 수 있어야 합니다. 그래서 정적 분석, AI 분석, 오탐 검토, 리포트를 단계 카드로 보여줬습니다.

### 13.1 GitHub 캐시를 쓴 이유

같은 저장소를 반복해서 테스트하면 GitHub API rate limit에 걸릴 수 있습니다. 그래서 이전에 가져온 저장소 정보와 파일 내용을 캐시해서 다시 사용할 수 있게 했습니다.

발표 답변:

> GitHub API는 요청 제한이 있기 때문에 같은 저장소를 반복 분석할 때는 캐시를 사용해서 불필요한 API 호출을 줄였습니다.

### 13.2 지원 언어

파일 확장자를 기준으로 JavaScript, TypeScript, Python, Java, C/C++, PHP 등 주요 언어를 감지합니다.

왜 확장자 기반으로 감지하는가:

> 프론트엔드에서 가볍게 동작해야 하므로 복잡한 파서 대신 파일 확장자를 기준으로 언어를 먼저 판단했습니다.

## 14. Dashboard 로직

위치: `src/pages/Dashboard.jsx`

대시보드는 현재 프로젝트의 최종 보안 결과를 보여줍니다.

결과 우선순위:

```text
오탐 검토 후 실제 취약점
  -> AI 분석 결과
  -> 정적 분석 결과
```

왜 이렇게 했는가:

> 최종 화면에서는 사용자가 실제로 조치해야 할 취약점 수를 보여줘야 합니다. 그래서 오탐 검토가 끝났다면 오탐을 제외한 결과를 가장 우선으로 사용합니다.

보여주는 정보:

- 총 취약점 수
- High 위험도 개수
- Medium 위험도 개수
- 보안 점수
- 보안 등급
- 위험도 분포 차트
- 취약점 목록

## 15. My Page와 분석 히스토리

관련 위치:

- `src/pages/MyPage.jsx`
- `src/services/scanHistoryService.js`

마이페이지는 사용자의 과거 분석 기록과 통계를 보여줍니다.

보여주는 정보:

- 총 검사 횟수
- 발견된 누적 취약점 수
- 고친 취약점 수
- 오탐 수
- 위험도별 누적 통계
- 분석 히스토리
- 검색, 위험도 필터, 날짜 필터

### 15.1 고친 취약점 계산

핵심 함수는 `compareAndSaveScan`입니다.

동작:

1. 같은 파일명의 이전 검사 결과를 찾습니다.
2. 이전 검사에는 있었지만 새 검사에는 없는 취약점 ID를 찾습니다.
3. 사라진 취약점을 "고친 취약점"으로 계산합니다.

왜 썼는가:

> 단순히 취약점을 찾는 것에서 끝나지 않고, 시간이 지나면서 사용자가 실제로 얼마나 개선했는지 보여주기 위해 구현했습니다.

발표 답변:

> 같은 파일을 다시 검사했을 때 이전 취약점과 현재 취약점의 ID를 비교해서 사라진 항목을 고친 취약점으로 판단합니다.

## 16. Report 화면

위치: `src/pages/Report.jsx`

분석 결과를 최종 리포트 형태로 보여주고 PDF로 저장할 수 있게 합니다.

사용한 라이브러리:

- `html2canvas`: 화면을 이미지처럼 캡처
- `jspdf`: 캡처한 내용을 PDF 파일로 생성

왜 썼는가:

> 발표나 보고서 제출 상황에서 분석 결과를 파일로 남길 수 있어야 합니다. 그래서 웹 화면의 리포트를 PDF로 변환하는 기능을 넣었습니다.

## 17. 취약점 카드와 상세 설명

관련 위치:

- `src/components/VulnerabilityCard.jsx`
- `src/components/VulnerabilityDetailDialog.jsx`
- `src/services/vulnerabilityInfo.js`
- `src/services/remediationService.js`

취약점 목록은 카드 형태로 보여주고, 카드를 클릭하면 상세 설명 모달이 열립니다.

상세 모달에서 보여주는 정보:

- 취약점 이름
- 위험도
- 파일 경로와 줄 번호
- 취약한 코드
- 취약점 설명
- 공격 시나리오
- 추천 수정 코드
- side-by-side diff
- 오탐 신고 버튼

왜 컴포넌트로 나눴는가:

> 대시보드, AI 분석, 오탐 검토, GitHub Connect 등 여러 화면에서 같은 취약점 카드를 사용하기 때문에 재사용 가능한 컴포넌트로 만들었습니다.

### 17.1 추천 수정 코드

`remediationService.js`는 취약점 종류에 따라 안전한 코드 예시와 설명을 제공합니다.

예시 답변:

> SQL Injection이면 문자열을 직접 합치는 방식 대신 파라미터화된 쿼리를 보여줍니다. 삭제된 코드는 붉은색, 추가된 코드는 녹색으로 표시해서 개발자가 어떤 부분을 바꿔야 하는지 쉽게 이해할 수 있게 했습니다.

## 18. 공통 컴포넌트를 만든 이유

대표 컴포넌트:

- `PageHeader`
- `StatCard`
- `VulnerabilityCard`
- `VulnerabilityDetailDialog`
- `AppLayout`

왜 썼는가:

> 같은 모양의 카드나 제목, 취약점 목록을 여러 화면에서 반복해서 만들면 수정할 때 실수가 생깁니다. 공통 컴포넌트로 만들면 디자인과 동작을 한 곳에서 관리할 수 있습니다.

발표 답변:

> 반복되는 UI를 컴포넌트화해서 코드 중복을 줄이고, 화면 간 디자인 일관성을 유지했습니다.

## 19. 주요 라이브러리 사용 이유

### React

상태가 바뀌면 화면을 자동으로 다시 그리기 좋습니다.

### React Router

`/login`, `/dashboard`, `/github`, `/my-page`처럼 화면 주소를 나누기 위해 사용했습니다.

### MUI

버튼, 카드, 입력창, 다이얼로그 같은 UI를 빠르게 만들고 다크모드 테마를 일관되게 적용하기 위해 사용했습니다.

### Monaco Editor

코드 붙여넣기와 파일 업로드 후 코드 확인을 개발자에게 익숙한 방식으로 제공하기 위해 사용했습니다.

### Recharts

위험도 분포를 그래프로 시각화하기 위해 사용했습니다.

### html2canvas / jsPDF

리포트 화면을 PDF로 저장하기 위해 사용했습니다.

## 20. 데이터 규격과 JavaScript 가공 로직

교수님이 "DB나 서버에서 받아온 가공되지 않은 데이터는 화면에서 원하는 규격과 다를 수 있는데, 원하는 데이터 규격은 무엇이고 JavaScript에서 어떻게 처리했나요?"라고 물어볼 수 있습니다.

SecureLens는 백엔드와 DB 없이 동작하지만, 같은 개념이 GitHub API 응답, 정적 분석 결과, AI 응답, LocalStorage 데이터에도 적용됩니다. 즉, 외부에서 들어온 원본 데이터를 그대로 화면에 쓰지 않고, 화면과 통계에 필요한 형태로 정규화해서 저장합니다.

### 20.1 우리가 원하는 최종 데이터 규격

분석 결과는 기본적으로 아래 형태를 목표로 합니다.

```js
{
  scanId: "검사 고유 ID",
  fileName: "분석한 파일명 또는 저장소명",
  scanDate: "YYYY-MM-DD HH:mm",
  vulnerabilities: [
    {
      id: "취약점 고유 ID",
      type: "SQL Injection",
      severity: "High",
      filePath: "src/app.py",
      line: 12,
      code: "cursor.execute(query)",
      cwe: "CWE-89",
      source: "request.args.get('id')",
      sink: "cursor.execute(query)",
      sanitization: "없음",
      attackPath: "사용자 입력이 SQL 실행 지점까지 전달됨",
      fix: "파라미터화된 쿼리 사용"
    }
  ],
  severityCounts: {
    High: 1,
    Medium: 0,
    Low: 0
  },
  securityScore: 80,
  fixedCount: 0,
  falsePositiveCount: 0
}
```

이 규격이 필요한 이유:

- 대시보드는 `vulnerabilities`, `severityCounts`, `securityScore`가 필요합니다.
- 마이페이지는 `scanDate`, `fileName`, `fixedCount`, `falsePositiveCount`가 필요합니다.
- 취약점 상세 모달은 `type`, `line`, `code`, `attackPath`, `fix`가 필요합니다.
- 고친 취약점 계산은 각 취약점의 `id`가 필요합니다.

발표 답변:

> 화면마다 필요한 데이터가 다르기 때문에 원본 데이터를 그대로 쓰지 않고, 분석 결과를 하나의 공통 규격으로 맞췄습니다. 취약점 목록, 위험도 통계, 보안 점수, 검사 날짜, 고친 취약점 수를 같은 구조로 저장해서 대시보드와 마이페이지가 같은 데이터를 재사용할 수 있게 했습니다.

### 20.2 원본 데이터와 화면 데이터가 다른 이유

예를 들어 GitHub API에서 받아오는 데이터는 분석 결과가 아니라 저장소 파일 정보입니다.

GitHub API 원본 데이터 예시:

```js
{
  name: "vulnerable.py",
  path: "demo/vulnerable.py",
  type: "blob",
  sha: "...",
  url: "..."
}
```

하지만 대시보드가 원하는 데이터는 파일 목록이 아니라 취약점 목록입니다.

대시보드가 원하는 데이터 예시:

```js
{
  type: "Command Injection",
  severity: "High",
  filePath: "demo/vulnerable.py",
  line: 20,
  code: "os.system(command)"
}
```

그래서 JavaScript에서 다음 흐름으로 데이터를 변환합니다.

```text
GitHub 원본 파일 목록
  -> 분석 가능한 확장자만 필터링
  -> 파일 내용 가져오기
  -> 정적 분석으로 취약점 후보 생성
  -> AI 분석으로 source/sink/공격 가능성 보강
  -> 오탐 제거
  -> Dashboard/MyPage용 공통 규격으로 저장
```

### 20.3 JavaScript에서 데이터를 가공하는 방식

대표적으로 사용하는 방식은 `map`, `filter`, `reduce`, `Set`입니다.

#### map: 데이터 모양 바꾸기

`map`은 원본 배열을 화면에서 필요한 형태로 바꿀 때 사용합니다.

```js
const normalizedVulnerabilities = vulnerabilities.map((vulnerability, index) => ({
  ...vulnerability,
  id: vulnerability.id || `${vulnerability.type}-${vulnerability.filePath}-${index + 1}`,
  severity: normalizeSeverity(vulnerability.severity),
}));
```

발표 답변:

> 원본 취약점 데이터에 ID가 없거나 위험도 표기가 제각각일 수 있어서 `map`으로 돌면서 필요한 필드를 보완하고 화면에서 쓰기 좋은 형태로 바꿨습니다.

#### filter: 필요한 데이터만 남기기

`filter`는 오탐을 제외하거나 지원하지 않는 파일을 제외할 때 사용합니다.

```js
const realFindings = reviewResults.filter((item) => item.status === "REAL");
```

발표 답변:

> 최종 대시보드에는 실제 조치가 필요한 취약점만 보여줘야 하므로, 오탐으로 분류된 항목은 `filter`로 제외했습니다.

#### reduce: 통계 만들기

`reduce`는 취약점 목록을 위험도별 개수나 총합 통계로 바꿀 때 사용합니다.

```js
const severityCounts = vulnerabilities.reduce(
  (counts, vulnerability) => {
    counts[vulnerability.severity] += 1;
    return counts;
  },
  { High: 0, Medium: 0, Low: 0 },
);
```

발표 답변:

> 화면에는 단순 목록뿐 아니라 High, Medium, Low 개수도 필요합니다. 그래서 배열을 `reduce`로 순회하면서 통계 객체로 변환했습니다.

#### Set: 이전 검사와 현재 검사 비교

고친 취약점 계산에는 `Set`을 사용합니다.

```js
const currentIds = new Set(
  currentScan.vulnerabilities.map((vulnerability) => vulnerability.id),
);
```

왜 썼는가:

> 현재 검사에 남아 있는 취약점 ID를 빠르게 확인하기 위해 `Set`을 사용했습니다. 이전 검사에는 있었는데 현재 Set에 없으면 고친 취약점으로 판단합니다.

### 20.4 데이터 정규화가 필요한 이유

정규화는 데이터 표현을 일정하게 맞추는 작업입니다.

예를 들어 위험도 값이 다음처럼 들어올 수 있습니다.

```text
high
High
HIGH
High Risk
```

이 값을 그대로 쓰면 통계가 깨집니다. 그래서 `normalizeSeverity` 같은 함수로 모두 `High`, `Medium`, `Low` 형태로 맞춥니다.

발표 답변:

> 외부 데이터는 표기 방식이 일정하지 않을 수 있습니다. 그래서 JavaScript에서 정규화 함수를 두고, 위험도나 취약점 ID처럼 통계에 중요한 값은 저장 전에 공통 형식으로 맞췄습니다.

### 20.5 백엔드가 생긴다면 어떻게 바뀌는가

현재는 LocalStorage가 DB 역할을 하지만, 실제 서비스에서는 서버에서 데이터를 받아올 수 있습니다.

그 경우에도 프론트엔드 흐름은 비슷합니다.

```text
서버 응답
  -> JSON 파싱
  -> 필요한 필드만 추출
  -> 누락값 기본값 처리
  -> 위험도/날짜/ID 정규화
  -> React state에 저장
  -> 화면 렌더링
```

발표 답변:

> 백엔드가 생겨도 서버 응답을 화면에 바로 쓰지는 않습니다. 프론트엔드에서 필요한 데이터 모델로 한 번 변환하고, 누락된 값이나 표기 차이를 정리한 뒤 state에 저장해서 화면에 렌더링합니다.

### 20.6 이 질문에 대한 최종 답변 예시

> DB나 서버에서 온 데이터는 보통 화면에서 바로 쓰기 좋은 형태가 아닙니다. SecureLens에서는 화면과 통계에서 공통으로 쓰기 위해 `scanId`, `fileName`, `scanDate`, `vulnerabilities`, `severityCounts`, `securityScore` 같은 규격으로 맞췄습니다. JavaScript에서는 `map`으로 필드를 보완하고, `filter`로 오탐이나 불필요한 파일을 제외하고, `reduce`로 위험도별 통계를 만들었습니다. 또 위험도 표기처럼 값이 제각각일 수 있는 부분은 정규화 함수를 통해 `High`, `Medium`, `Low`로 통일했습니다.

## 21. 발표 예상 질문과 답변

### Q1. 왜 백엔드 없이 만들었나요?

A. 과제 조건상 프론트엔드에서 모든 데이터 저장과 통계 처리를 구현해야 했기 때문입니다. 그래서 LocalStorage를 DB처럼 사용했습니다. 다만 실제 서비스에서는 서버와 DB가 반드시 필요합니다.

### Q2. LocalStorage는 안전한가요?

A. 완전히 안전하지 않습니다. 브라우저에 저장되기 때문에 XSS에 취약할 수 있습니다. 이 프로젝트에서는 시연과 과제 조건을 위해 사용했고, 실제 서비스에서는 서버 세션과 DB를 사용해야 합니다.

### Q3. API 키를 프론트에 두면 안 되지 않나요?

A. 맞습니다. 실제 서비스에서는 AI API 키를 백엔드에 숨겨야 합니다. 현재 프로젝트는 프론트엔드 중심 시연이라 fallback 로직을 넣어 API 키 없이도 동작하도록 했습니다.

### Q4. 정적 분석만으로 취약점을 정확히 찾을 수 있나요?

A. 완벽하지 않습니다. 정적 분석은 빠르지만 오탐이 생길 수 있습니다. 그래서 AI 분석과 오탐 검토 단계를 추가해 최종 결과의 품질을 높였습니다.

### Q5. GitHub 저장소 분석은 어떻게 하나요?

A. GitHub API로 저장소 파일 목록과 파일 내용을 가져온 뒤, 지원하는 확장자의 파일만 분석합니다. 이후 정적 분석, AI 분석, 오탐 검토를 순서대로 실행합니다.

### Q6. 왜 캐시를 넣었나요?

A. GitHub API에는 요청 제한이 있습니다. 같은 저장소를 여러 번 테스트할 때 매번 API를 호출하면 제한에 걸릴 수 있어서 캐시를 사용했습니다.

### Q7. 오탐 신고는 실제로 어디로 보내지나요?

A. 현재는 백엔드가 없기 때문에 LocalStorage에 저장됩니다. 실제 서비스라면 이 데이터를 서버로 보내 AI 모델 개선이나 운영자 검토에 활용할 수 있습니다.

### Q8. 고친 취약점은 어떻게 계산하나요?

A. 같은 파일을 다시 검사했을 때 이전 결과에 있었지만 현재 결과에는 없는 취약점 ID를 고친 항목으로 판단합니다.

### Q9. admin 계정은 왜 있나요?

A. 발표 시 바로 시연할 수 있도록 더미 계정을 넣었습니다. `admin / Admin!1234`로 로그인하면 회원가입 없이 서비스 흐름을 보여줄 수 있습니다.

### Q10. 계정 삭제를 하면 분석 기록도 지워지나요?

A. 네. 현재 로그인한 사용자의 분석 데이터만 삭제됩니다. 다른 사용자의 데이터는 사용자 ID로 분리되어 있어서 함께 지워지지 않습니다.

## 22. 발표용 1분 코드 설명

> 이 프로젝트는 React 기반의 프론트엔드 보안 분석 서비스입니다. `App.jsx`에서 로그인 여부에 따라 보호 라우팅을 처리하고, 로그인 후에는 `AppLayout`을 통해 사이드바와 기능 화면을 보여줍니다. 데이터는 백엔드 없이 LocalStorage에 저장하지만, 사용자별 key를 분리해서 admin 기록이 다른 사용자에게 보이지 않도록 했습니다. 분석은 정적 분석, AI 분석, 오탐 검토 순서로 진행됩니다. 정적 분석은 빠르게 위험 패턴을 찾고, AI 분석은 source에서 sink까지 입력값이 검증 없이 흘러가는지 확인해 실제 공격 가능성을 판단합니다. 오탐 검토는 실제 조치가 필요한 취약점만 남기는 역할을 합니다. 마지막으로 대시보드, 리포트, 마이페이지에서 분석 결과와 히스토리를 확인할 수 있게 구성했습니다.

## 23. 한계점까지 말하면 좋은 부분

발표에서 한계를 먼저 인정하면 오히려 더 설득력 있게 보입니다.

말할 수 있는 한계:

- LocalStorage는 실제 DB보다 보안과 안정성이 낮습니다.
- 프론트엔드에 API 키를 두는 구조는 실제 서비스에 적합하지 않습니다.
- 현재 정적 분석은 규칙 기반이므로 전문 SAST 도구보다 정밀도가 낮습니다.
- 실제 서비스라면 백엔드, DB, 서버 인증, 권한 관리, 큐 기반 분석 시스템이 필요합니다.

마무리 답변:

> 현재 구현은 프론트엔드 중심의 프로토타입이지만, 실제 서비스로 확장한다면 백엔드에서 인증과 API 키를 관리하고, 분석 결과를 DB에 저장하며, 더 정교한 정적 분석 엔진을 붙이는 방향으로 발전시킬 수 있습니다.
