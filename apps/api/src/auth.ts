import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { getEnv } from "./env";

export type AccessTokenClaims = {
  sub: string;
  email: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
};

export function newUserId() {
  return `usr_${nanoid(16)}`;
}

export function signAccessToken(input: { userId: string; email: string }) {
  const env = getEnv();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + env.ACCESS_TOKEN_TTL_SECONDS;

  const token = jwt.sign(
    { email: input.email },
    env.JWT_SECRET,
    {
      subject: input.userId,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    },
  );

  return { token, exp };
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const env = getEnv();
  const verified = jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  if (typeof verified !== "object" || verified === null) {
    throw new Error("Invalid token payload");
  }
  const claims = verified as jwt.JwtPayload;
  const sub = claims.sub;
  const email = claims.email;
  if (typeof sub !== "string" || typeof email !== "string") {
    throw new Error("Invalid token claims");
  }
  return {
    sub,
    email,
    iss: String(claims.iss),
    aud: String(claims.aud),
    iat: Number(claims.iat),
    exp: Number(claims.exp),
  };
}

