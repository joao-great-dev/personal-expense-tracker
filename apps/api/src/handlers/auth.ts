import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { loginRequestSchema, signupRequestSchema } from "@pet/shared";
import { badRequest, json } from "../http";
import { createUser, ensurePredefinedCategories, getUserByEmail, verifyUserPassword } from "../repo";
import { newUserId, signAccessToken } from "../auth";

const parseBody = (body: string | undefined) => {
  if (!body) return { ok: false as const, error: "Missing request body" };
  try {
    return { ok: true as const, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false as const, error: "Invalid JSON body" };
  }
};

export const signup: APIGatewayProxyHandlerV2 = async (event) => {
  const parsedBody = parseBody(event.body);
  if (!parsedBody.ok) return badRequest(parsedBody.error);

  const parsed = signupRequestSchema.safeParse(parsedBody.value);
  if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) return badRequest("Email already registered");

  const userId = newUserId();
  const user = await createUser({ email: parsed.data.email, password: parsed.data.password, userId });
  await ensurePredefinedCategories(user.userId);

  const { token, exp } = signAccessToken({ userId: user.userId, email: user.email });
  return json(201, { userId: user.userId, email: user.email, accessToken: token, exp });
};

export const login: APIGatewayProxyHandlerV2 = async (event) => {
  const parsedBody = parseBody(event.body);
  if (!parsedBody.ok) return badRequest(parsedBody.error);

  const parsed = loginRequestSchema.safeParse(parsedBody.value);
  if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

  const user = await verifyUserPassword({ email: parsed.data.email, password: parsed.data.password });
  if (!user) return badRequest("Invalid email or password");

  const { token, exp } = signAccessToken({ userId: user.userId, email: user.email });
  return json(200, { userId: user.userId, email: user.email, accessToken: token, exp });
};

