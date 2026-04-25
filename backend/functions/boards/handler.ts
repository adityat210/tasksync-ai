import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const method = event.requestContext.httpMethod;

  if (method === "POST") {
    const body = JSON.parse(event.body || "{}");

    const boardId = uuid();

    const item = {
      PK: `BOARD#${boardId}`,
      SK: "METADATA",
      boardId,
      name: body.name || "Untitled Board",
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
    const boardId = event.pathParameters?.boardId;

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

  return { message: "Boards endpoint working" };
});