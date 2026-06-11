export function validateEmail(email) {
  if (!email) return false;
  if (!email.includes("@") || email.split("@").length !== 2) return false;

  const [local, domain] = email.split("@");
  return Boolean(
    local &&
      domain &&
      domain.includes(".") &&
      !domain.startsWith(".") &&
      !domain.endsWith("."),
  );
}

export function validatePassword(password) {
  if (!password) return false;

  const specialChars = new Set([
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "_",
    "+",
    "-",
    "=",
    "[",
    "]",
    "{",
    "}",
    ";",
    "'",
    ":",
    '"',
    "\\",
    "|",
    ",",
    ".",
    "<",
    ">",
    "/",
    "?",
    "`",
    "~",
  ]);

  return password.length >= 8 && [...password].some((char) => specialChars.has(char));
}

export function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword;
}

export function sanitizeInput(input) {
  if (typeof input !== "string") return "";

  const sqlDangerousPattern =
    /('|--|;|\/\*|\*\/|xp_|exec|select|insert|update|delete|drop|alter|create|union|or\s+1=1|and\s+1=1)/gi;

  return input.trim().replace(sqlDangerousPattern, "");
}
