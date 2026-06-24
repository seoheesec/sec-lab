import { getUsers, saveSession, saveUsers } from "./storageService";

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

export async function ensureDemoAdmin() {
  const users = getUsers();
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
