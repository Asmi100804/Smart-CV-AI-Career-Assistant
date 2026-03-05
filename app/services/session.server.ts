import { createCookieSessionStorage } from "react-router";

const sessionSecret = process.env.SESSION_SECRET ?? "smartcv-dev-session-secret-change-me";

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

type SessionData = {
  userEmail?: string;
};

const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "__smartcv_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
