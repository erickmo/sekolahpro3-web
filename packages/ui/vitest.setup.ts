import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library tidak auto-cleanup saat vitest globals=false. Tanpa ini
// elemen test sebelumnya tetap di DOM dan `getByRole` melempar "multiple
// elements found" pada test berikutnya.
afterEach(() => {
  cleanup();
});
