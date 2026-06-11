import { commitSession, destroySession, getSession } from "./session.server";

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
