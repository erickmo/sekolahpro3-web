import { frappeFetch, setCsrfToken } from "@sekolahpro/api-client";
import { useSessionStore } from "./store";

export async function login(usr: string, pwd: string): Promise<void> {
  await frappeFetch("login", { usr, pwd });
  await hydrateSession();
}

export async function logout(): Promise<void> {
  try {
    await frappeFetch("logout", {});
  } finally {
    setCsrfToken(undefined);
    useSessionStore.getState().clear();
  }
}

export async function hydrateSession(): Promise<void> {
  const user = await frappeFetch<string>("frappe.auth.get_logged_user", {});
  if (!user || user === "Guest") {
    useSessionStore.getState().clear();
    return;
  }
  const roles = await frappeFetch<string[]>(
    "frappe.core.doctype.user.user.get_roles",
    { uid: user },
  );
  const csrf = await frappeFetch<string>(
    "sekolahpro.api.auth.get_csrf",
    {},
  ).catch(() => "");
  setCsrfToken(csrf);
  useSessionStore.getState().setSession({ user, roles, csrfToken: csrf });
}
