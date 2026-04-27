import { DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";


const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (event: any) => {
  const routeKey = event.requestContext.routeKey;
  const connectionId = event.requestContext.connectionId;

  if (routeKey === "$connect") {
    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "CONNECTIONS",
          SK: `CONNECTION#${connectionId}`,
          connectionId,
          createdAt: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      body: "Connected",
    };
  }

  if (routeKey === "$disconnect") {
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "CONNECTIONS",
          SK: `CONNECTION#${connectionId}`,
        },
      })
    );

    return {
      statusCode: 200,
      body: "Disconnected",
    };
  }

  return {
    statusCode: 200,
    body: "Realtime route working",
  };
};