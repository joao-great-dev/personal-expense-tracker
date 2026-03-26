import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
});

export type WebEnv = z.infer<typeof envSchema>;

export function getEnv(): WebEnv {
  const parsed = envSchema.safeParse(import.meta.env);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i: { path: Array<string | number>; message: string }) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`Missing/invalid frontend env: ${msg}`);
  }
  return parsed.data;
}

