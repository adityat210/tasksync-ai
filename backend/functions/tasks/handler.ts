import {DeleteCommand, PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb"
import {v4 as uuid} from "uuid";

import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
    //Get http method: post, put, delete
    const method = event.httpMethod;
    // If there is no body use empty object
    const body = JSON.parse(event.body || "{}");

    //comes from api rout parameters
    const boardId = event.pathParameters?.boardId;
    const taskId = event.pathParameters?.taskId;

    //each tasks needs to be assigned to board so required
    if (!boardId) {
        return {
        error: "Missing boardId",
        };
    }

    //CREATE TASK
    if (method === "POST") {
        const newTaskId = uuid();

        const item = { 
            PK: `BOARD#${boardId}`,
            SK: `TASK#${newTaskId}`,

            taskId: newTaskId,
            boardId,

            //defaults "todo" if not specified columnId
            columnId: body.columnId || "todo",

            title: body.title || "Untitled Task",
            description: body.description || "",

            //used later for ordering tasks inside a column
            position: body.position ?? 0,

            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        //save task item into Dynamo
        await db.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item,
            })
        );

        return item;
    }

    //update, PUT
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
                UpdateExpression:
                    "SET title = :title, description = :description, columnId = :columnId, position = :position, updatedAt = :updatedAt",
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
    
    //DELETE
    if (method === "DELETE") {
        if (!taskId) {
            return {
                error: "Missing taskId",
            };
        }

        //remove from dynamodDB
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

    //catcher for unsupported methods
    return {
        message: "Tasks endpoint working",
    };
});

