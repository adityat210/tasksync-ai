import { randomUUID } from "crypto";
import { DeleteCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  // get HTTP method: POST, PUT, DELETE
  const method = event.httpMethod;

  // if no body, use empty object
  const body = JSON.parse(event.body || "{}");

  // comes from API route parameters
  const boardId = event.pathParameters?.boardId;
  const taskId = event.pathParameters?.taskId;

  // task needs to be assigned to a board
  if (!boardId) {
    return {
      error: "Missing boardId",
    };
  }

  // CREATE 
  if (method === "POST") {
    const newTaskId = randomUUID();

    const item = {
      PK: `BOARD#${boardId}`,
      SK: `TASK#${newTaskId}`,

      taskId: newTaskId,
      boardId,

      columnId: body.columnId || "todo",

      title: body.title || "Untitled Task",
      description: body.description || "",

      // later for ordering tasks inside a column
      position: body.position ?? 0,

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

  // UPDATE 
  if (method === "PUT") {
    if (!taskId) {
      return {
        error: "Missing taskId",
      };
    }

    await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `BOARD#${boardId}`,
          SK: `TASK#${taskId}`,
        },

        // "position" is a reserved, alias it as #position.
        UpdateExpression:
          "SET title = :title, description = :description, columnId = :columnId, #position = :position, updatedAt = :updatedAt",

        ExpressionAttributeNames: {
          "#position": "position",
        },

        ExpressionAttributeValues: {
          ":title": body.title || "Untitled Task",
          ":description": body.description || "",
          ":columnId": body.columnId || "todo",
          ":position": body.position ?? 0,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    return {
      message: "Task updated",
      taskId,
    };
  }

  // DELETE
  if (method === "DELETE") {
    if (!taskId) {
      return {
        error: "Missing taskId",
      };
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

    return {
      message: "Task deleted",
      taskId,
    };
  }

  return {
    message: "Tasks endpoint working",
  };
});