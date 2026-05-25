import { frappeFetch, FrappeError, setCsrfToken } from "@sekolahpro/api-client";
import { useSessionStore } from "./store";

export class LoginError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "LoginError";
  }
}

function humaneLoginMessage(err: unknown): string {
  if (err instanceof FrappeError) {
    if (err.status === 401) return "Email atau kata sandi salah. Coba lagi.";
    if (err.status === 403) return "Akun Anda dinonaktifkan. Hubungi admin sekolah.";
    if (err.status === 417) return "Akun terkunci sementara karena terlalu banyak percobaan. Tunggu beberapa menit.";
    if (err.status === 429) return "Terlalu banyak percobaan masuk. Coba lagi sebentar lagi.";
    if (err.status >= 500) return "Server sedang bermasalah. Coba lagi beberapa saat.";
    const payload = err.payload as { message?: string; exc_type?: string } | undefined;
    if (payload?.message && typeof payload.message === "string") return payload.message;
  }
  if (err instanceof TypeError) return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  return "Gagal masuk. Coba lagi.";
}

export async function login(usr: string, pwd: string): Promise<void> {
  try {
    await frappeFetch("login", { usr, pwd });
  } catch (e) {
    throw new LoginError(humaneLoginMessage(e), e);
  }
  await hydrateSession({ throwOnFail: true });
}

export async function logout(): Promise<void> {
  try {
    await frappeFetch("logout", {});
  } finally {
    setCsrfToken(undefined);
    useSessionStore.getState().clear();
  }
}

export async function hydrateSession(opts: { throwOnFail?: boolean } = {}): Promise<void> {
  try {
    const user = await frappeFetch<string>("frappe.auth.get_logged_user", {});
    if (!user || user === "Guest") {
      useSessionStore.getState().clear();
      if (opts.throwOnFail) {
        throw new LoginError(
          "Sesi tidak tersimpan. Periksa pengaturan cookie/CORS server.",
        );
      }
      return;
    }
    const roles = await frappeFetch<string[]>(
      "frappe.core.doctype.user.user.get_roles",
      { uid: user },
    ).catch(() => [] as string[]);
    const csrf = await frappeFetch<string>(
      "sekolahpro.api.auth.get_csrf",
      {},
    ).catch(() => "");
    setCsrfToken(csrf);
    useSessionStore.getState().setSession({ user, roles, csrfToken: csrf });
  } catch (e) {
    useSessionStore.getState().clear();
    if (opts.throwOnFail) throw e instanceof LoginError ? e : new LoginError(humaneLoginMessage(e), e);
  }
}
