import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { commitSession, destroySession, getSession } from "./session.server";

const scrypt = promisify(scryptCallback);
const USERS_FILE = process.env.VERCEL
  ? resolve("/tmp", "smartcv", "users.json")
  : resolve(process.cwd(), ".data", "users.json");

type StoredUser = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

type UsersDb = {
  users: StoredUser[];
};

async function ensureUsersFile() {
  await mkdir(dirname(USERS_FILE), { recursive: true });
  try {
    await readFile(USERS_FILE, "utf-8");
  } catch {
    await writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf-8");
  }
}

async function readUsersDb(): Promise<UsersDb> {
  await ensureUsersFile();
  const raw = await readFile(USERS_FILE, "utf-8");
  return JSON.parse(raw) as UsersDb;
}

async function writeUsersDb(data: UsersDb) {
  await writeFile(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [salt, originalHash] = passwordHash.split(":");
  if (!salt || !originalHash) return false;

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const originalBuffer = Buffer.from(originalHash, "hex");

  if (originalBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(originalBuffer, derivedKey);
}

export async function signUp(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await readUsersDb();

  const existingUser = db.users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);
  db.users.push({
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  await writeUsersDb(db);

  return { userEmail: normalizedEmail };
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = await readUsersDb();

  const user = db.users.find((entry) => entry.email === normalizedEmail);
  if (!user) return { error: "Invalid email or password." };

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) return { error: "Invalid email or password." };

  return { userEmail: user.email };
}

export async function createUserSession(request: Request, userEmail: string, redirectTo: string = "/") {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("userEmail", userEmail);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/auth",
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function getUserEmail(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("userEmail");
}

export async function requireUser(request: Request) {
  const userEmail = await getUserEmail(request);

  if (!userEmail) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/auth?redirectTo=${redirectTo}`,
      },
    });
  }

  return userEmail;
}
