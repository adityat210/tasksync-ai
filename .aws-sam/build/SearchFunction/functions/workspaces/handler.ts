import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const method = event.httpMethod;
  const body = JSON.parse(event.body || "{}");

  const workspaceId = event.pathParameters?.workspaceId;

  if (method === "POST") {
    const newWorkspaceId = randomUUID();

    const item = {
      PK: `WORKSPACE#${newWorkspaceId}`,
      SK: "METADATA",
      workspaceId: newWorkspaceId,
      name: body.name || "Untitled Workspace",
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

  if (method === "GET") {
    if (!workspaceId) {
      return {
        error: "Missing workspaceId",
      };
    }

    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `WORKSPACE#${workspaceId}`,
        },
      })
    );

    return result.Items || [];
  }

  return {
    message: "Workspaces endpoint working",
  };
});