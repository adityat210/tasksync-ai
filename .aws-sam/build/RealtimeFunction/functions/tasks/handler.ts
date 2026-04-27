import { randomUUID } from "crypto";
import {DeleteCommand,PutCommand,QueryCommand,UpdateCommand,} from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { broadcastMessage } from "../../shared/realtime/broadcast";
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
      status: body.status || body.columnId || "todo",
      columnId: body.columnId || body.status || "todo",
      assigneeUserId: body.assigneeUserId || "",
      position: body.position ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    await broadcastMessage({
      type: "BOARD_UPDATED",
      boardId,
      action: "TASK_CREATED",
      taskId: newTaskId,
    });

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

    const nextStatus = body.status || body.columnId || "todo";
    const nextColumnId = body.columnId || body.status || "todo";

    const result = await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: `TASK#${taskId}`,
        },
        UpdateExpression:
          "SET title = :title, description = :description, #status = :status, columnId = :columnId, assigneeUserId = :assigneeUserId, #position = :position, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
          "#position": "position",
        },
        ExpressionAttributeValues: {
          ":title": body.title || "Untitled Task",
          ":description": body.description || "",
          ":status": nextStatus,
          ":columnId": nextColumnId,
          ":assigneeUserId": body.assigneeUserId || "",
          ":position": body.position ?? 0,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    await broadcastMessage({
      type: "BOARD_UPDATED",
      boardId,
      action: "TASK_UPDATED",
      taskId,
    });

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

    await broadcastMessage({
      type: "BOARD_UPDATED",
      boardId,
      action: "TASK_DELETED",
      taskId,
    });

    return { message: "Task deleted", taskId };
  }

  return {
    message: "Tasks endpoint working",
  };
});