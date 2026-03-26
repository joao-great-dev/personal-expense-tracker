import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { unauthorized } from "./http";
import { verifyAccessToken } from "./auth";

export type AuthedContext = {
  userId: string;
  email: string;
};

export function requireAuth(
  event: APIGatewayProxyEventV2,
): { ok: true; auth: AuthedContext } | { ok: false; response: ReturnType<typeof unauthorized> } {
  const header =
    event.headers?.authorization ?? event.headers?.Authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return { ok: false, response: unauthorized("Missing Bearer token") };
  }
  try {
    const claims = verifyAccessToken(token);
    return { ok: true, auth: { userId: claims.sub, email: claims.email } };
  } catch {
    return { ok: false, response: unauthorized("Invalid token") };
  }
}

