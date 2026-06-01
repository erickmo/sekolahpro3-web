import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { renderApp } from "./test-utils";

async function gotoPpdb() {
  renderApp(<App />, "/ppdb");
  // wait for site resolution (offline → demo) + the form to mount
  return screen.findByRole("button", { name: /Kirim Pendaftaran/i });
}

describe("PPDB registration (per-school, offline demo)", () => {
  it("blocks submit and shows validation errors when empty", async () => {
    const user = userEvent.setup();
    const submit = await gotoPpdb();
    await user.click(submit);
    expect(await screen.findByText("Nama wajib diisi")).toBeInTheDocument();
    expect(screen.getByText("NIK harus 16 digit")).toBeInTheDocument();
  });

  it("submits a valid form and shows the success receipt", async () => {
    const user = userEvent.setup();
    const submit = await gotoPpdb();

    await user.selectOptions(screen.getByLabelText("Jalur"), "Reguler");
    await user.selectOptions(screen.getByLabelText("Gelombang"), "GEL-1");
    await user.type(screen.getByLabelText("Nama Lengkap"), "Budi Santoso");
    await user.type(screen.getByLabelText("NIK"), "1234567890123456");
    await user.selectOptions(screen.getByLabelText("Jenis Kelamin"), "L");
    await user.type(screen.getByLabelText("Tempat Lahir"), "Bandung");
    await user.type(screen.getByLabelText("Tanggal Lahir"), "2012-05-01");
    await user.type(screen.getByLabelText("Asal Sekolah"), "SD Merdeka");
    await user.type(screen.getByLabelText("No HP"), "081234567890");
    await user.type(screen.getByLabelText("Alamat"), "Jl. Mawar 1");
    await user.type(screen.getByLabelText("Nama Ayah"), "Santoso");
    await user.type(screen.getByLabelText("Nama Ibu"), "Sumarni");
    await user.click(screen.getByLabelText("Persetujuan"));

    await user.click(submit);

    await waitFor(() => {
      expect(screen.getByText("Pendaftaran Berhasil!")).toBeInTheDocument();
    });
    expect(screen.getByText(/PPDB-DEMO-/)).toBeInTheDocument();
  });
});
