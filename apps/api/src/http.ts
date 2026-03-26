import type { APIGatewayProxyResultV2 } from "aws-lambda";

export type HttpResponse = APIGatewayProxyResultV2;

export const json = (
  statusCode: number,
  body: unknown,
  headers?: Record<string, string>,
): HttpResponse => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    ...(headers ?? {}),
  },
  body: JSON.stringify(body),
});

export const badRequest = (message: string, details?: unknown) =>
  json(400, { message, details });

export const unauthorized = (message = "Unauthorized") => json(401, { message });

export const notFound = (message = "Not found") => json(404, { message });

