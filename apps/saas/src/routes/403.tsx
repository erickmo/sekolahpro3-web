import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@sekolahpro/ui";
import { logout } from "@sekolahpro/auth";

const APP_NAME = "SekolahPro";
const REQUIRED_ROLE = "SekolahPro Admin";

/**
 * Forbidden (403) screen.
 *
 * Reached when a signed-in user passes authentication but lacks the
 * `SekolahPro Admin` role enforced by RequireAuth in __root. Without this
 * route the role-denied Navigate target would hit the router's not-found
 * handler instead of an explanatory page.
 */
export function ForbiddenPage() {
  const navigate = useNavigate();

  /** Clear the session and return to the login screen to switch accounts. */
  async function handleSignOut() {
    await logout();
    void navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-200 via-bg to-violet-200 p-6">
      <main className="w-full max-w-md rounded-2xl border border-border bg-bg/80 p-8 text-center shadow-xl shadow-fg/5 backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-2xl font-bold text-danger">
          403
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Akses ditolak</h1>
        <p className="mt-2 text-sm text-muted-fg">
          Akun Anda berhasil masuk, tetapi tidak memiliki peran{" "}
          <span className="font-medium text-fg">{REQUIRED_ROLE}</span> yang
          dibutuhkan untuk membuka konsol {APP_NAME}.
        </p>
        <p className="mt-1 text-sm text-muted-fg">
          Hubungi administrator platform, atau masuk dengan akun lain.
        </p>

        <Button
          type="button"
          size="lg"
          onClick={handleSignOut}
          className="mt-6 w-full"
        >
          Keluar &amp; masuk akun lain
        </Button>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/403")({ component: ForbiddenPage });
