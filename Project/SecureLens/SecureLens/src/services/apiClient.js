const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export const delay = (ms = 350) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export function isMockApi() {
  return USE_MOCK_API || !API_BASE_URL;
}

export async function request(path, options = {}) {
  if (isMockApi()) {
    throw new ApiError(`Mock handler is not implemented for ${path}`, 501);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(body?.message || "API 요청에 실패했습니다.", response.status, body);
  }

  return body;
}

export function createMockResponse(data, ms = 350) {
  return delay(ms).then(() => structuredClone(data));
}
