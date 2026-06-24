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

export function parseGitHubUrl(repoUrl) {
  try {
    const url = new URL(repoUrl);
    const [, owner, repo] = url.pathname.split("/");

    if (!owner || !repo || url.hostname !== "github.com") {
      throw new Error();
    }

    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
    };
  } catch {
    throw new Error("올바른 GitHub 저장소 URL을 입력하세요.");
  }
}

export function isSupportedFile(path) {
  return SUPPORTED_EXTENSIONS.some((extension) =>
    path.toLowerCase().endsWith(extension),
  );
}

async function requestGitHub(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("GitHub 저장소에 접근할 수 없습니다.");
  }

  return response.json();
}

export async function fetchRepository(owner, repo) {
  return requestGitHub(`https://api.github.com/repos/${owner}/${repo}`);
}

export async function fetchContents(owner, repo, path = "") {
  const encodedPath = path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  return requestGitHub(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`,
  );
}

export async function fetchFileContent(owner, repo, path) {
  const data = await fetchContents(owner, repo, path);

  if (!data.content) {
    throw new Error("파일 내용을 불러올 수 없습니다.");
  }

  const binary = atob(data.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder("utf-8").decode(bytes);
}

export async function collectRepositoryFiles(owner, repo, path = "", limit = 40) {
  const collected = [];

  async function walk(currentPath) {
    if (collected.length >= limit) return;

    const contents = await fetchContents(owner, repo, currentPath);
    const list = Array.isArray(contents) ? contents : [contents];

    for (const item of list) {
      if (collected.length >= limit) break;

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
