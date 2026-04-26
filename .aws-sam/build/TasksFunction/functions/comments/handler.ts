import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const method = event.httpMethod;
  const body = JSON.parse(event.body || "{}");

  const taskId = event.pathParameters?.taskId;

  if (!taskId) {
    return {
      error: "Missing taskId",
    };
  }

  if (method === "POST") {
    const commentId = randomUUID();

    const item = {
      PK: `TASK#${taskId}`,
      SK: `COMMENT#${new Date().toISOString()}#${commentId}`,
      commentId,
      taskId,
      userId: body.userId || "unknown-user",
      body: body.body || "",
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

  if (method === "GET") {
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `TASK#${taskId}`,
          ":sk": "COMMENT#",
        },
      })
    );

    return result.Items || [];
  }

  return {
    message: "Comments endpoint working",
  };
});