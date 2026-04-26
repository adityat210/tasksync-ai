import type {APIGatewayProxyResult} from "aws-lambda";
import type {ApiResponse} from "../types/api";

/**
 * bulding json response in format expected by API gateway
 * every lambda handler should return: http status code, headers, a stringified response
 */

export function jsonResponse<T>(
    statusCode: number, 
    body: ApiResponse<T>
): APIGatewayProxyResult {
    return {
        statusCode, headers: {
            "Content-Type": "application/json",
            /**
             * intentiaonally permissive for current dev
             */
            "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify(body)
    };
}

export function successResponse<T>(
    statusCode: number, 
    data: T
): APIGatewayProxyResult {
    return jsonResponse(statusCode, {
        success: true, 
        data
    });
}

export function errorResponse(
    statusCode: number, 
    message: string, 
    code?: string
): APIGatewayProxyResult {
    return jsonResponse(statusCode, {
        success: false,
        error: {
            message,
            code
        }
    });
}