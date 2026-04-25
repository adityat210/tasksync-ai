import type {
    APIGatewayProxyEvent, 
    APIGatewayProxyResult
} from "aws-lambda";
import {errorResponse, successResponse} from "../../shared/utils/responses";

/**
 * basic backend health check
 * confirming lambda handler structure works
 * gives first endpoint for API gatway later
 * can be used in CI 
 */

export async function handler(
    event: APIGatewayProxyEvent
): Promise <APIGatewayProxyResult> {
    try {
        return successResponse(200, {
            service: "tasksync-backend",
            status: "ok",
            path: event.path ?? null,
            timestamp: new Date().toISOString()
        });
    } catch(error){
        console.error("Health check failed:", error);
        return errorResponse(
            500, "Unable to complete health check.", "HEALTH_CHECK_FAILED"
        );
    }
}