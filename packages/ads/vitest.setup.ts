import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// globals:false → RTL won't auto-cleanup; without this, leaked DOM nodes cause
// "Found multiple elements" in the next test.
afterEach(() => {
  cleanup();
});
