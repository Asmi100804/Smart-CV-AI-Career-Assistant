const USERS_STORAGE_KEY = "smartcv:local-users";
const PASSWORD_HASH_ALGORITHM = "PBKDF2-SHA-256";
const PASSWORD_HASH_ITERATIONS = 150_000;

type StoredLocalUser = {
  email: string;
  passwordHash: string;
  salt: string;
  algorithm: typeof PASSWORD_HASH_ALGORITHM;
  iterations: number;
  createdAt: string;
};

type LocalUsersDb = {
  users: StoredLocalUser[];
};

type AuthResult =
  | { userEmail: string }
  | { error: string };

function assertBrowserStorageAvailable() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Browser local storage is not available.");
  }

  if (!window.crypto?.subtle) {
    throw new Error("Secure browser crypto is not available. Please use HTTPS or localhost.");
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function isStoredLocalUser(value: unknown): value is StoredLocalUser {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<StoredLocalUser>;
  return (
    typeof candidate.email === "string" &&
    typeof candidate.passwordHash === "string" &&
    typeof candidate.salt === "string" &&
    candidate.algorithm === PASSWORD_HASH_ALGORITHM &&
    typeof candidate.iterations === "number" &&
    Number.isInteger(candidate.iterations) &&
    candidate.iterations > 0 &&
    typeof candidate.createdAt === "string"
  );
}

function readUsersDb(): LocalUsersDb {
  assertBrowserStorageAvailable();

  const rawUsers = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!rawUsers) return { users: [] };

  try {
    const parsed = JSON.parse(rawUsers) as Partial<LocalUsersDb>;
    if (!Array.isArray(parsed.users)) return { users: [] };

    return { users: parsed.users.filter(isStoredLocalUser) };
  } catch {
    return { users: [] };
  }
}

function writeUsersDb(db: LocalUsersDb) {
  assertBrowserStorageAvailable();
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(db));
}

async function hashPassword(password: string, salt: Uint8Array, iterations = PASSWORD_HASH_ITERATIONS) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: bytesToArrayBuffer(salt),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return bytesToBase64(new Uint8Array(derivedBits));
}

function safeHashCompare(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

export async function signUpWithLocalStorage(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);
  const db = readUsersDb();

  const existingUser = db.users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await hashPassword(password, salt);

  db.users.push({
    email: normalizedEmail,
    passwordHash,
    salt: bytesToBase64(salt),
    algorithm: PASSWORD_HASH_ALGORITHM,
    iterations: PASSWORD_HASH_ITERATIONS,
    createdAt: new Date().toISOString(),
  });

  writeUsersDb(db);
  return { userEmail: normalizedEmail };
}

export async function loginWithLocalStorage(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = normalizeEmail(email);
  const db = readUsersDb();

  const user = db.users.find((entry) => entry.email === normalizedEmail);
  if (!user) return { error: "Invalid email or password." };

  const passwordHash = await hashPassword(password, base64ToBytes(user.salt), user.iterations);
  if (!safeHashCompare(passwordHash, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  return { userEmail: user.email };
}
