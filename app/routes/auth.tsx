import { Form, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/auth";
import { createUserSession, getUserEmail, login, signUp } from "~/services/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const userEmail = await getUserEmail(request);
  if (userEmail) {
    return redirect("/");
  }

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirectTo") || "/";

  return { redirectTo };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const mode = formData.get("mode");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirectTo") || "/");

  if (email.length < 3 || !email.includes("@")) {
    return { error: "Please provide a valid email address.", mode };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", mode };
  }

  if (mode === "signup") {
    const result = await signUp(email, password);
    if ("error" in result) {
      return { error: result.error, mode };
    }

    return createUserSession(request, result.userEmail, redirectTo);
  }

  const result = await login(email, password);
  if ("error" in result) {
    return { error: result.error, mode: "login" };
  }

  return createUserSession(request, result.userEmail, redirectTo);
}

export default function Auth() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [mode, setMode] = useState<"login" | "signup">((actionData?.mode as "login" | "signup") ?? "login");
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.mode === "signup" || actionData?.mode === "login") {
      setMode(actionData.mode);
    }
  }, [actionData?.mode]);

  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-4xl text-center mb-2">Welcome to SmartCV</h1>
        <p className="text-gray-600 text-center mb-8">Sign up or log in to continue.</p>

        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {actionData.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 p-1 rounded-full">
          <button
            className={`w-full py-2 rounded-full font-medium transition-all ${
              mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}
            type="button"
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            className={`w-full py-2 rounded-full font-medium transition-all ${
              mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}
            type="button"
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>

        <Form method="post" className="gap-4">
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="form-div">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" autoComplete="email" required />
          </div>

          <div className="form-div">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
            />
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
          </button>
        </Form>
      </div>
    </main>
  );
}
