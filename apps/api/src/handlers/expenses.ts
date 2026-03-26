import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createExpenseRequestSchema, updateExpenseRequestSchema } from "@pet/shared";
import { badRequest, json, notFound } from "../http";
import { requireAuth } from "../middleware";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "../repo";

const parseBody = (body: string | undefined) => {
  if (!body) return { ok: false as const, error: "Missing request body" };
  try {
    return { ok: true as const, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false as const, error: "Invalid JSON body" };
  }
};

export const list: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;

  const qs = event.queryStringParameters ?? {};
  const from = qs.from;
  const to = qs.to;
  const categoryId = qs.categoryId;

  const items = await listExpenses({
    userId: auth.auth.userId,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(categoryId ? { categoryId } : {}),
  });
  return json(200, { items });
};

export const create: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;

  const parsedBody = parseBody(event.body);
  if (!parsedBody.ok) return badRequest(parsedBody.error);

  const parsed = createExpenseRequestSchema.safeParse(parsedBody.value);
  if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

  const item = await createExpense({ userId: auth.auth.userId, ...parsed.data });
  return json(201, { item });
};

export const update: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;
  const expenseId = event.pathParameters?.expenseId;
  if (!expenseId) return badRequest("Missing expenseId");

  const parsedBody = parseBody(event.body);
  if (!parsedBody.ok) return badRequest(parsedBody.error);

  const parsed = updateExpenseRequestSchema.safeParse(parsedBody.value);
  if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

  const patch = {
    ...(typeof parsed.data.amount === "number" ? { amount: parsed.data.amount } : {}),
    ...(typeof parsed.data.description === "string" ? { description: parsed.data.description } : {}),
    ...(typeof parsed.data.categoryId === "string" ? { categoryId: parsed.data.categoryId } : {}),
    ...(typeof parsed.data.date === "string" ? { date: parsed.data.date } : {}),
  };

  try {
    const item = await updateExpense({
      userId: auth.auth.userId,
      expenseId,
      patch,
    });
    if (!item) return notFound("Expense not found");
    return json(200, { item });
  } catch {
    return notFound("Expense not found");
  }
};

export const remove: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;
  const expenseId = event.pathParameters?.expenseId;
  if (!expenseId) return badRequest("Missing expenseId");

  await deleteExpense({ userId: auth.auth.userId, expenseId });
  return json(204, {});
};

