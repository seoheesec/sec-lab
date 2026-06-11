import { ApiError, createMockResponse, isMockApi, request } from "../../services/apiClient";

const repositories = [
  {
    id: 1,
    name: "enterprise-spring-backend",
    description: "금융권 표준 아키텍처 기반 Java Spring Boot 백엔드",
    defaultLang: "JAVA",
    visibility: "Private",
    url: "https://github.com/secure-admin/enterprise-spring-backend",
    branches: ["main", "develop", "feature/security"],
  },
  {
    id: 2,
    name: "secure-lens-frontend",
    description: "React와 Zustand 기반 보안 분석 플랫폼 프론트엔드",
    defaultLang: "JS",
    visibility: "Public",
    url: "https://github.com/secure-admin/secure-lens-frontend",
    branches: ["main", "dev"],
  },
  {
    id: 3,
    name: "ai-code-scanner-core",
    description: "LLM 기반 정적 분석과 Source-to-Sink 추적 엔진",
    defaultLang: "PYTHON",
    visibility: "Private",
    url: "https://github.com/secure-admin/ai-code-scanner-core",
    branches: ["main", "release-v1.0"],
  },
  {
    id: 4,
    name: "high-perf-go-crawler",
    description: "대규모 저장소 수집을 위한 Go 기반 크롤러",
    defaultLang: "GO",
    visibility: "Public",
    url: "https://github.com/secure-admin/high-perf-go-crawler",
    branches: ["main", "crawler-pipeline"],
  },
];

export async function connectGithub({ token }) {
  if (!isMockApi()) {
    return request("/github/connect", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  await createMockResponse(null, 350);

  if (!token?.startsWith("ghp_")) {
    throw new ApiError("GitHub 토큰 형식이 올바르지 않습니다.", 400);
  }

  return {
    user: {
      name: "secure-admin",
      email: "secure-admin@github.local",
      avatarUrl: "",
    },
    repositories,
  };
}

export async function getRepositories() {
  if (!isMockApi()) return request("/github/repositories");
  return createMockResponse(repositories);
}

export async function getBranches(repoId) {
  if (!isMockApi()) return request(`/github/repositories/${repoId}/branches`);

  const repo = repositories.find((item) => String(item.id) === String(repoId));
  if (!repo) throw new ApiError("저장소를 찾을 수 없습니다.", 404);
  return createMockResponse(repo.branches);
}
