import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export function createHandler(
  fn: (event: APIGatewayProxyEvent) => Promise<any>
) {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const result = await fn(event);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(result),
      };
    } catch (error: any) {
      console.error(error);

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Internal server error",
        }),
      };
    }
  };
}