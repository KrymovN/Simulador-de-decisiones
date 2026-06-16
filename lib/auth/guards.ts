import { redirect } from "next/navigation";
import { buildLoginRedirectPath } from "./redirects";
import { readServerAuthSession } from "./session";

export async function requireAuthenticatedDashboardSession(nextPath = "/dashboard") {
  const context = await readServerAuthSession();

  if (context.identityState === "authenticated") {
    return context;
  }

  const reason = context.error?.code ?? "session_missing";

  redirect(buildLoginRedirectPath(reason, nextPath));
}
