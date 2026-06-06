// ABS-002 — layar login guru (mode kelas)
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginView } from "../login";

// RTL cleanup tidak otomatis di repo ini (globals on, autoClean off).
afterEach(cleanup);

const SAMPLE_USER = "guru1";
const SAMPLE_PWD = "rahasia";

describe("LoginView", () => {
  it("memanggil onLogin dengan kredensial yang dimasukkan saat submit", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginView onLogin={onLogin} />);

    await userEvent.type(screen.getByLabelText(/pengguna/i), SAMPLE_USER);
    await userEvent.type(screen.getByLabelText(/sandi/i), SAMPLE_PWD);
    await userEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(SAMPLE_USER, SAMPLE_PWD));
  });

  it("menampilkan role=alert berisi pesan gagal saat onLogin ditolak", async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error("boom"));
    render(<LoginView onLogin={onLogin} />);

    await userEvent.type(screen.getByLabelText(/pengguna/i), SAMPLE_USER);
    await userEvent.type(screen.getByLabelText(/sandi/i), SAMPLE_PWD);
    await userEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/gagal/i);
    });
  });
});
