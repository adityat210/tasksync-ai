/**
 * shared api response types for lambda handlers
 * ensuring frontend has same response structure from every endpoint
 */

export interface ApiSuccessResponse<T>{
    success: true;
    data: T;
}

export interface ApiErrorResponse{
    success: false;
    error: {
        message: string;
        code?: string;
    }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
