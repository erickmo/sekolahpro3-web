import { z } from "zod";

// A service base may be an absolute URL (https://api.example.com), an empty
// string (same-origin), or a relative path like "/api" (the Vite dev proxy
// convention). The old `url() | ""` union rejected the relative form and
// crashed apps that proxy /api (e.g. merchant).
const baseUrl = z.union([
  z.string().url(),
  z.literal(""),
  z.string().startsWith("/"),
]);

export const envSchema = z.object({
  VITE_API_BASE: baseUrl,
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_ADS_BASE: baseUrl.optional(),
  VITE_ADS_PROPERTY_KEY: z.string().optional(),
  MODE: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return envSchema.parse(raw);
}
