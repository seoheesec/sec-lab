import {
  clearAnalysisData,
  clearSession,
  getSession,
  getUsers,
  saveSession,
  saveUsers,
} from "./storageService";

const encoder = new TextEncoder();
const DEMO_ADMIN = {
  id: "admin",
  email: "admin@securelens.local",
  password: "Admin!1234",
};

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function hashPassword(password, saltBytes) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

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

  return toBase64(bits);
}

// 회원가입 시 비밀번호를 그대로 저장하지 않고,
// salt와 PBKDF2 해시를 이용해 LocalStorage에 저장할 사용자 객체를 만듭니다.
async function createUser({ id, email, password }) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);

  return {
    id,
    email,
    passwordHash,
    salt: toBase64(salt),
    failedAttempts: 0,
    lockedUntil: null,
    createdAt: new Date().toISOString(),
  };
}

// 시연을 위해 admin 계정을 항상 준비합니다.
// 실제 서비스라면 서버에서 관리자 계정을 관리해야 합니다.
export async function ensureDemoAdmin() {
  const users = getUsers();
  const existingAdmin = users.find((user) => user.id === DEMO_ADMIN.id);

  if (existingAdmin?.passwordHash && existingAdmin?.salt) {
    return;
  }

  const admin = await createUser(DEMO_ADMIN);
  const otherUsers = users.filter((user) => user.id !== DEMO_ADMIN.id);

  saveUsers([admin, ...otherUsers]);
}

export function getDemoAdminCredentials() {
  return {
    id: DEMO_ADMIN.id,
    password: DEMO_ADMIN.password,
  };
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  return /^(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

export async function signUp({ id, email, password }) {
  await ensureDemoAdmin();

  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedId = id.trim();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("This email is already in use.");
  }

  if (users.some((user) => user.id === normalizedId)) {
    throw new Error("This ID is already in use.");
  }

  const createdUser = await createUser({
    id: normalizedId,
    email: normalizedEmail,
    password,
  });

  saveUsers([...users, createdUser]);

  return { id: createdUser.id, email: createdUser.email };
}

export async function login({ id, password }) {
  await ensureDemoAdmin();

  const users = getUsers();
  const normalizedId = id.trim();
  const userIndex = users.findIndex((user) => user.id === normalizedId);

  if (userIndex < 0) {
    throw new Error("The ID or password does not match.");
  }

  const user = users[userIndex];
  const now = Date.now();

  if (user.lockedUntil && now < user.lockedUntil) {
    throw new Error("Too many failed attempts. Try again in a few minutes.");
  }

  const passwordHash = await hashPassword(password, fromBase64(user.salt));

  if (passwordHash !== user.passwordHash) {
    const failedAttempts = (user.failedAttempts || 0) + 1;
    const lockedUntil = failedAttempts >= 5 ? now + 5 * 60 * 1000 : null;

    users[userIndex] = {
      ...user,
      failedAttempts,
      lockedUntil,
    };
    saveUsers(users);

    if (lockedUntil) {
      throw new Error("Too many failed attempts. Try again in a few minutes.");
    }

    throw new Error("The ID or password does not match.");
  }

  const session = {
    token: crypto.randomUUID(),
    user: {
      id: user.id,
      email: user.email,
    },
    createdAt: new Date().toISOString(),
  };

  users[userIndex] = {
    ...user,
    failedAttempts: 0,
    lockedUntil: null,
  };

  saveUsers(users);
  saveSession(session);

  return session;
}

// 현재 로그인한 계정을 삭제합니다.
// demo admin은 발표/시연용 계정이라 삭제하지 못하게 막았습니다.
export function deleteCurrentAccount() {
  const session = getSession();

  if (!session) {
    throw new Error("로그인된 사용자가 없습니다.");
  }

  if (session.user.id === DEMO_ADMIN.id) {
    throw new Error("데모 admin 계정은 삭제할 수 없습니다.");
  }

  const users = getUsers();
  const nextUsers = users.filter((user) => user.id !== session.user.id);

  saveUsers(nextUsers);
  clearAnalysisData();
  clearSession();
}
