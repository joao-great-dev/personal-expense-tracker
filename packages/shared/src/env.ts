import { z } from "zod";

export const nonEmptyString = z.string().min(1);

export type EnvIssue = { key: string; message: string };

export function requireEnv(
  env: Record<string, string | undefined>,
  schema: z.ZodTypeAny,
): { ok: true; value: z.infer<typeof schema> } | { ok: false; issues: EnvIssue[] } {
  const parsed = schema.safeParse(env);
  if (parsed.success) return { ok: true, value: parsed.data as z.infer<typeof schema> };

  const issues: EnvIssue[] = parsed.error.issues.map((i) => ({
    key: i.path.join(".") || "env",
    message: i.message,
  }));
  return { ok: false, issues };
}

