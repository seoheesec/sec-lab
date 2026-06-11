import { ApiError, createMockResponse, isMockApi, request } from "../../services/apiClient";

const registeredEmails = new Set(["admin@securelens.com", "test@test.com"]);

export async function login(payload) {
  if (!isMockApi()) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  const { id, password } = payload;
  await createMockResponse(null, 250);

  if (id === "admin" && password === "admin123!") {
    return {
      user: { id: "admin", email: "admin@securelens.com", role: "Master" },
      accessToken: "mock-jwt-token",
      message: "로그인 성공",
    };
  }

  throw new ApiError("입력한 정보가 일치하지 않습니다.", 401);
}

export async function checkEmailDuplicate(email) {
  if (!isMockApi()) {
    return request(`/auth/email-check?email=${encodeURIComponent(email)}`);
  }

  return createMockResponse({
    duplicated: registeredEmails.has(email.trim().toLowerCase()),
  });
}

export async function register(payload) {
  if (!isMockApi()) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  const email = payload.email.trim().toLowerCase();
  const duplicate = registeredEmails.has(email);
  await createMockResponse(null, 300);

  if (duplicate) {
    throw new ApiError("이미 사용 중인 이메일입니다.", 409);
  }

  registeredEmails.add(email);
  return {
    success: true,
    message: "회원가입이 완료되었습니다.",
  };
}
