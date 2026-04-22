import { createCookieSessionStorage } from "react-router";

const fallbackSessionSecret = "smartcv-dev-session-secret-change-me";
const configuredSessionSecret = process.env.SESSION_SECRET?.trim();

const sessionSecret = configuredSessionSecret
  ? configuredSessionSecret.length >= 32
    ? configuredSessionSecret
    : configuredSessionSecret.padEnd(32, "_")
  : fallbackSessionSecret;

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
