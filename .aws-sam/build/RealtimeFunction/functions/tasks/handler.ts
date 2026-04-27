import { randomUUID } from "crypto";
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const method = event.httpMethod;
  const body = JSON.parse(event.body || "{}");

  const boardId = event.pathParameters?.boardId;
  const taskId = event.pathParameters?.taskId;

  if (!boardId) {
    return { error: "Missing boardId" };
  }

  if (method === "POST") {
    const newTaskId = randomUUID();
    const now = new Date().toISOString();

    const item = {
      PK: `BOARD#${boardId}`,
      SK: `TASK#${newTaskId}`,
      taskId: newTaskId,
      boardId,
      title: body.title || "Untitled Task",
      description: body.description || "",
      status: body.status || "todo",
      assigneeUserId: body.assigneeUserId || "",
      createdAt: now,
      updatedAt: now,
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
          ":pk": `BOARD#${boardId}`,
          ":sk": "TASK#",
        },
      })
    );

    return result.Items || [];
  }

  if (method === "PUT") {
    if (!taskId) {
      return { error: "Missing taskId" };
    }

    const result = await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: `TASK#${taskId}`,
        },
        UpdateExpression:
          "SET title = :title, description = :description, #status = :status, assigneeUserId = :assigneeUserId, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":title": body.title || "Untitled Task",
          ":description": body.description || "",
          ":status": body.status || "todo",
          ":assigneeUserId": body.assigneeUserId || "",
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  }

  if (method === "DELETE") {
    if (!taskId) {
      return { error: "Missing taskId" };
    }

    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: `TASK#${taskId}`,
        },
      })
    );

    return { message: "Task deleted", taskId };
  }

  return {
    message: "Tasks endpoint working",
  };
});