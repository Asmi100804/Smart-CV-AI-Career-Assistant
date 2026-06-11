import { Form, redirect, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Route } from "./+types/auth";
import { createUserSession, getUserEmail } from "~/services/auth.server";
import { loginWithLocalStorage, signUpWithLocalStorage } from "~/lib/local-auth";

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
  const redirectTo = String(formData.get("redirectTo") || "/");

  if (email.length < 3 || !email.includes("@")) {
    return { error: "Please provide a valid email address.", mode };
  }

  if (mode !== "session") {
    return { error: "Please use the browser form to sign up or log in.", mode: "login" };
  }

  return createUserSession(request, email, redirectTo);
}

export default function Auth() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const [mode, setMode] = useState<"login" | "signup">((actionData?.mode as "login" | "signup") ?? "login");
  const [localError, setLocalError] = useState<string | null>(null);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.mode === "signup" || actionData?.mode === "login") {
      setMode(actionData.mode);
    }
  }, [actionData?.mode]);

  const handleModeChange = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setLocalError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (email.length < 3 || !email.includes("@")) {
      setLocalError("Please provide a valid email address.");
      return;
    }

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }

    try {
      const result = mode === "signup"
        ? await signUpWithLocalStorage(email, password)
        : await loginWithLocalStorage(email, password);

      if ("error" in result) {
        setLocalError(result.error);
        return;
      }

      const sessionData = new FormData();
      sessionData.set("mode", "session");
      sessionData.set("email", result.userEmail);
      sessionData.set("redirectTo", redirectTo);
      submit(sessionData, { method: "post" });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    }
  };

  return (
    <main className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-4xl text-center mb-2">Welcome to SmartCV</h1>
        <p className="text-gray-600 text-center mb-8">Sign up or log in to continue.</p>

        {(localError || actionData?.error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4">
            {localError || actionData?.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-100 p-1 rounded-full">
          <button
            className={`w-full py-2 rounded-full font-medium transition-all ${
              mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}
            type="button"
            onClick={() => handleModeChange("login")}
          >
            Log in
          </button>
          <button
            className={`w-full py-2 rounded-full font-medium transition-all ${
              mode === "signup" ? "bg-white shadow-sm text-gray-900" : "text-gray-600"
            }`}
            type="button"
            onClick={() => handleModeChange("signup")}
          >
            Sign up
          </button>
        </div>

        <Form method="post" className="gap-4" onSubmit={handleSubmit}>
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
