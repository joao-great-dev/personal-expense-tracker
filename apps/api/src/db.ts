import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getEnv } from "./env";

export function createDocClient() {
  const env = getEnv();
  const endpoint = env.DYNAMODB_ENDPOINT?.trim();

  const client = new DynamoDBClient(
    endpoint
      ? { endpoint, region: "local", credentials: { accessKeyId: "x", secretAccessKey: "x" } }
      : {},
  );

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

