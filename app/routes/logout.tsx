import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { logout } from "~/services/auth.server";

export async function loader() {
  return redirect("/");
}

export async function action({ request }: Route.ActionArgs) {
  return logout(request);
}

export default function LogoutRoute() {
  return null;
}
