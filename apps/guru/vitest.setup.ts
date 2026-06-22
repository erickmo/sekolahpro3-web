import "@testing-library/jest-dom/vitest";
import { configure } from "@sekolahpro/api-client";

// frappeFetch builds `${baseUrl}/api/method/...`. Empty baseUrl yields a
// relative URL that jsdom resolves against window.location, so any network
// call in tests should be stubbed via injected props (no real fetch).
configure({ baseUrl: "" });
