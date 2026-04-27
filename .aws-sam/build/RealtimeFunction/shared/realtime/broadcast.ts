import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../db/client";

const TABLE_NAME = process.env.TABLE_NAME!;
const WS_API_ENDPOINT = process.env.WS_API_ENDPOINT!;

export async function broadcastMessage(message: unknown) {
  if (!WS_API_ENDPOINT) {
    console.warn("Missing WS_API_ENDPOINT");
    return;
  }

  const result = await db.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "CONNECTIONS",
      },
    })
  );

  const connections = result.Items || [];

  const client = new ApiGatewayManagementApiClient({
    endpoint: WS_API_ENDPOINT,
  });

  await Promise.all(
    connections.map(async (connection) => {
      try {
        await client.send(
          new PostToConnectionCommand({
            ConnectionId: connection.connectionId,
            Data: Buffer.from(JSON.stringify(message)),
          })
        );
      } catch (error: any) {
        if (error?.$metadata?.httpStatusCode === 410) {
          await db.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: {
                PK: "CONNECTIONS",
                SK: `CONNECTION#${connection.connectionId}`,
              },
            })
          );
        } else {
          console.error("Broadcast failed:", error);
        }
      }
    })
  );
}