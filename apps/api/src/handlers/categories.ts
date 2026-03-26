import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { createCategoryRequestSchema, updateCategoryRequestSchema } from "@pet/shared";
import { badRequest, json, notFound } from "../http";
import { requireAuth } from "../middleware";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../repo";

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
  const items = await listCategories(auth.auth.userId);
  return json(200, { items });
};

export const create: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;

  const parsedBody = parseBody(event.body);
  if (!parsedBody.ok) return badRequest(parsedBody.error);

  const parsed = createCategoryRequestSchema.safeParse(parsedBody.value);
  if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

  const item = await createCategory({ userId: auth.auth.userId, name: parsed.data.name });
  return json(201, { item });
};

export const update: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;
  const categoryId = event.pathParameters?.categoryId;
  if (!categoryId) return badRequest("Missing categoryId");

  const parsedBody = parseBody(event.body);
  if (!parsedBody.ok) return badRequest(parsedBody.error);

  const parsed = updateCategoryRequestSchema.safeParse(parsedBody.value);
  if (!parsed.success) return badRequest("Invalid request", parsed.error.flatten());

  try {
    const item = await updateCategory({
      userId: auth.auth.userId,
      categoryId,
      name: parsed.data.name,
    });
    if (!item) return notFound("Category not found");
    return json(200, { item });
  } catch {
    return notFound("Category not found");
  }
};

export const remove: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;
  const categoryId = event.pathParameters?.categoryId;
  if (!categoryId) return badRequest("Missing categoryId");

  await deleteCategory({ userId: auth.auth.userId, categoryId });
  return json(204, {});
};

