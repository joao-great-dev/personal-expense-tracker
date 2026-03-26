import { z } from "zod";
import { nonEmptyString, requireEnv } from "@pet/shared";

const envSchema = z.object({
  JWT_SECRET: nonEmptyString,
  JWT_ISSUER: nonEmptyString.default("pet-api"),
  JWT_AUDIENCE: nonEmptyString.default("pet-web"),
  ACCESS_TOKEN_TTL_SECONDS: z
    .string()
    .transform((v) => Number(v))
    .pipe(z.number().int().positive().max(60 * 60 * 24 * 30)),
  USERS_TABLE: nonEmptyString,
  CATEGORIES_TABLE: nonEmptyString,
  EXPENSES_TABLE: nonEmptyString,
  EXPENSES_GSI1: nonEmptyString.default("gsi1"),
  CORS_ORIGIN: nonEmptyString.default("*"),
  DYNAMODB_ENDPOINT: z.string().optional(),
});

export type ApiEnv = z.infer<typeof envSchema>;

export function getEnv(): ApiEnv {
  const res = requireEnv(process.env, envSchema);
  if (!res.ok) {
    const msg = res.issues.map((i) => `${i.key}: ${i.message}`).join(", ");
    throw new Error(`Missing/invalid environment variables: ${msg}`);
  }
  return res.value as ApiEnv;
}

