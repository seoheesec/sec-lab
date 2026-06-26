const SUPPORTED_EXTENSIONS = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".php",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
];
const GITHUB_CACHE_KEY = "secureLensGitHubCache";

// GitHub API는 비로그인 요청 제한이 낮기 때문에,
// 한 번 가져온 저장소 정보와 파일 내용을 브라우저에 캐시해 반복 호출을 줄입니다.
function readCache() {
  try {
    return JSON.parse(localStorage.getItem(GITHUB_CACHE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // If browser storage is full, keep the app usable without cache.
  }
}

function getCachedValue(key) {
  return readCache()[key]?.value;
}

function setCachedValue(key, value) {
  const cache = readCache();

  cache[key] = {
    savedAt: new Date().toISOString(),
    value,
  };
  writeCache(cache);

  return value;
}

async function withCache(key, loader) {
  const cached = getCachedValue(key);

  if (cached) return cached;

  const value = await loader();
  return setCachedValue(key, value);
}

// 사용자가 입력한 GitHub URL에서 owner와 repo 이름만 추출합니다.
export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl.trim());
    const [, owner, repo] = url.pathname.split("/");

    if (!owner || !repo || !url.hostname.endsWith("github.com")) {
      throw new Error();
    }

    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
    };
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }
}

export function isSupportedFile(path) {
  return SUPPORTED_EXTENSIONS.some((extension) =>
    path.toLowerCase().endsWith(extension),
  );
}

// GitHub API 공통 요청 함수입니다.
// rate limit, private repo, 잘못된 URL 같은 오류를 사용자가 이해할 수 있는 메시지로 바꿉니다.
async function requestGitHub(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    let message = "GitHub request failed.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the generic message when GitHub does not return JSON.
    }

    if (response.status === 403) {
      throw new Error(
        `${message} GitHub API rate limit may have been reached. Try again later or use a smaller demo repository.`,
      );
    }

    if (response.status === 404) {
      throw new Error(
        `${message} Check whether the repository exists and is public.`,
      );
    }

    throw new Error(`${message} (GitHub status ${response.status})`);
  }

  return response.json();
}

export async function fetchRepository(owner, repo) {
  return withCache(`repo:${owner}/${repo}`, () =>
    requestGitHub(`https://api.github.com/repos/${owner}/${repo}`),
  );
}

export async function fetchContents(owner, repo, path = "") {
  const encodedPath = path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const suffix = encodedPath ? `/${encodedPath}` : "";

  return withCache(`contents:${owner}/${repo}:${path || "root"}`, () =>
    requestGitHub(
      `https://api.github.com/repos/${owner}/${repo}/contents${suffix}`,
    ),
  );
}

export async function fetchFileContent(owner, repo, path) {
  const cached = getCachedValue(`file:${owner}/${repo}:${path}`);

  if (cached) return cached;

  const data = await fetchContents(owner, repo, path);

  if (!data.content) {
    throw new Error("Unable to load file content.");
  }

  const binary = atob(data.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return setCachedValue(
    `file:${owner}/${repo}:${path}`,
    new TextDecoder("utf-8").decode(bytes),
  );
}

// 저장소 전체를 분석할 때는 Git tree API로 파일 목록을 한 번에 가져옵니다.
export async function fetchRepositoryTree(owner, repo, branch = "HEAD") {
  const data = await withCache(`tree:${owner}/${repo}:${branch}`, () =>
    requestGitHub(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    ),
  );

  return (data.tree || [])
    .filter((item) => item.type === "blob" && isSupportedFile(item.path))
    .map((item) => ({
      name: item.path.split("/").pop(),
      path: item.path,
      size: item.size,
    }));
}

export function clearGitHubCache() {
  localStorage.removeItem(GITHUB_CACHE_KEY);
}

export async function collectRepositoryFiles(
  owner,
  repo,
  path = "",
  limit = 40,
  branch = "HEAD",
) {
  const collected = [];

  // 루트 저장소 분석은 recursive tree API를 사용해 빠르게 파일 목록을 모읍니다.
  if (!path) {
    const treeFiles = await fetchRepositoryTree(owner, repo, branch);
    return treeFiles.slice(0, limit);
  }

  async function walk(currentPath) {
    if (collected.length >= limit) return;

    const contents = await fetchContents(owner, repo, currentPath);
    const list = Array.isArray(contents) ? contents : [contents];

    for (const item of list) {
      if (collected.length >= limit) break;

      // 폴더를 선택한 경우에는 내부 폴더를 재귀적으로 따라 내려갑니다.
      if (item.type === "dir") {
        await walk(item.path);
      }

      if (item.type === "file" && isSupportedFile(item.path)) {
        collected.push(item);
      }
    }
  }

  await walk(path);

  return collected;
}
