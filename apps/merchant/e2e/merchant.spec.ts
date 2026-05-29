import { test, expect } from "@playwright/test";

const TOKEN = Buffer.from(
  JSON.stringify({
    kartu_id: "KARTU-001",
    nonce: "n",
    exp: Math.floor(Date.now() / 1000) + 60,
    hmac: "h",
  }),
).toString("base64url");

test("POS happy path", async ({ page }) => {
  // bypass login: stub session in localStorage
  await page.addInitScript(() => {
    localStorage.setItem(
      "sekolahpro:session",
      JSON.stringify({
        authenticated: true,
        claims: {
          merchant_id: "M-001",
          terminal_id: "TERM-M-001-00001",
          void_window_minutes: 10,
        },
      }),
    );
  });

  await page.goto("/pos?stub_session=1");
  await page.getByRole("button", { name: /nasi/i }).click();
  await expect(page.getByTestId("cart-total")).toContainText("15.000");

  // open reader sheet then inject token via window helper the app exposes in dev
  await page.getByRole("button", { name: /tap kartu siswa/i }).click();

  // dev-only: app exposes window.__devInjectCardToken when VITE_USE_MOCKS=true
  await page.evaluate(
    (tok) => (window as unknown as { __devInjectCardToken?: (t: string) => void }).__devInjectCardToken?.(tok),
    TOKEN,
  );

  await expect(page).toHaveURL(/\/pos\/confirm\//, { timeout: 5000 });
  await expect(page.getByText(/Berhasil/i)).toBeVisible();
});
