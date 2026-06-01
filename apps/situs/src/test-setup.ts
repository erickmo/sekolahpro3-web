import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest globals are enabled, but RTL auto-cleanup is not wired when a custom
// setup file is used; clean up the DOM between tests to avoid "found multiple
// elements" leaks across files.
afterEach(() => cleanup());
