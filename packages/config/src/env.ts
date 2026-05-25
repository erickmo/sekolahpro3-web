import { z } from "zod";

export const envSchema = z.object({
  VITE_API_BASE: z.union([z.string().url(), z.literal("")]),
  VITE_SENTRY_DSN: z.string().url().optional(),
  MODE: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return envSchema.parse(raw);
}
