import { randomUUID } from "crypto";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const method = event.httpMethod;
  const body = JSON.parse(event.body || "{}");

  const boardId = event.pathParameters?.boardId;
  const workspaceId = event.pathParameters?.workspaceId || body.workspaceId;

  if (method === "POST") {
    if (!workspaceId) {
      return { error: "Missing workspaceId" };
    }

    const newBoardId = randomUUID();

    const item = {
      PK: `WORKSPACE#${workspaceId}`,
      SK: `BOARD#${newBoardId}`,
      boardId: newBoardId,
      workspaceId,
      name: body.name || "Untitled Board",
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
    if (workspaceId) {
      const result = await db.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `WORKSPACE#${workspaceId}`,
            ":sk": "BOARD#",
          },
        })
      );

      return result.Items || [];
    }

    if (boardId) {
      const result = await db.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: {
            ":pk": `BOARD#${boardId}`,
          },
        })
      );

      return result.Items || [];
    }
  }

  return {
    message: "Boards endpoint working",
  };
});