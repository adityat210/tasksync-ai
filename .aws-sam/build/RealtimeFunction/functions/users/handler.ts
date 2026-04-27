import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const method = event.httpMethod;
  const body = JSON.parse(event.body || "{}");

  const workspaceId = event.pathParameters?.workspaceId;

  if (method === "POST" && event.path.includes("/users")) {
    const userId = randomUUID();

    const item = {
      PK: `USER#${userId}`,
      SK: "METADATA",
      userId,
      name: body.name || "Unnamed User",
      email: body.email || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return item;
  }

  if (method === "POST" && event.path.includes("/members")) {
    if (!workspaceId) {
      return { error: "Missing workspaceId" };
    }

    const userId = body.userId;
    const role = body.role || "member";

    const item = {
      PK: `WORKSPACE#${workspaceId}`,
      SK: `MEMBER#${userId}`,
      workspaceId,
      userId,
      role,
      createdAt: new Date().toISOString(),
    };

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return item;
  }

  if (method === "GET" && event.path.includes("/members")) {
    if (!workspaceId) {
      return { error: "Missing workspaceId" };
    }

    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `WORKSPACE#${workspaceId}`,
          ":sk": "MEMBER#",
        },
      })
    );

    return result.Items || [];
  }

  return {
    message: "Users endpoint working",
  };
});