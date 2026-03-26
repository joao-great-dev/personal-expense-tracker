import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { json } from "../http";
import { requireAuth } from "../middleware";
import { listExpenses } from "../repo";
import { groupTotalByCategory, groupTotalByMonth } from "../reporting";

export const byMonth: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;

  const qs = event.queryStringParameters ?? {};
  const from = qs.from;
  const to = qs.to;

  const expenses = await listExpenses({
    userId: auth.auth.userId,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });
  const items = groupTotalByMonth(expenses);
  return json(200, { items });
};

export const byCategory: APIGatewayProxyHandlerV2 = async (event) => {
  const auth = requireAuth(event);
  if (!auth.ok) return auth.response;

  const qs = event.queryStringParameters ?? {};
  const from = qs.from;
  const to = qs.to;

  const expenses = await listExpenses({
    userId: auth.auth.userId,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });
  const items = groupTotalByCategory(expenses);
  return json(200, { items });
};

