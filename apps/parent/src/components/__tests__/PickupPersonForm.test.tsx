import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PickupPersonForm } from "../PickupPersonForm";

describe("PickupPersonForm", () => {
  it("submits a valid payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PickupPersonForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/nama/i), "Pak Joko");
    await user.selectOptions(screen.getByLabelText(/hubungan/i), "Driver");
    await user.type(screen.getByLabelText(/nomor hp/i), "+6281234567890");
    await user.type(screen.getByLabelText(/^pin/i), "1234");
    await user.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      nama: "Pak Joko",
      hubungan: "Driver",
      phone: "+6281234567890",
      pin: "1234",
      photoUrl: null,
    });
  });

  it("shows validation errors and blocks submit when fields are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PickupPersonForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/nama wajib diisi/i)).toBeInTheDocument();
  });

  it("rejects an invalid pin", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<PickupPersonForm onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/nama/i), "Pak Joko");
    await user.type(screen.getByLabelText(/nomor hp/i), "+6281234567890");
    await user.type(screen.getByLabelText(/^pin/i), "12");
    await user.click(screen.getByRole("button", { name: /simpan/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/pin harus 4-6 digit/i)).toBeInTheDocument();
  });
});
