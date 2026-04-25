import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify({ message: "CORS OK" }),
  };
};