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
  return requestGitHub(`https://api.github.com/repos/${owner}/${repo}`);
}

export async function fetchContents(owner, repo, path = "") {
  const encodedPath = path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  const suffix = encodedPath ? `/${encodedPath}` : "";

  return requestGitHub(
    `https://api.github.com/repos/${owner}/${repo}/contents${suffix}`,
  );
}

export async function fetchFileContent(owner, repo, path) {
  const data = await fetchContents(owner, repo, path);

  if (!data.content) {
    throw new Error("Unable to load file content.");
  }

  const binary = atob(data.content.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder("utf-8").decode(bytes);
}

export async function fetchRepositoryTree(owner, repo, branch = "HEAD") {
  const data = await requestGitHub(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );

  return (data.tree || [])
    .filter((item) => item.type === "blob" && isSupportedFile(item.path))
    .map((item) => ({
      name: item.path.split("/").pop(),
      path: item.path,
      size: item.size,
    }));
}

export async function collectRepositoryFiles(
  owner,
  repo,
  path = "",
  limit = 40,
  branch = "HEAD",
) {
  const collected = [];

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
