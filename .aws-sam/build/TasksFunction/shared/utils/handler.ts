import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

export function createHandler(
  fn: (event: APIGatewayProxyEvent) => Promise<any>
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const result = await fn(event);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    } catch (error: any) {
      console.error(error);

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Internal server error",
        }),
      };
    }
  };
}