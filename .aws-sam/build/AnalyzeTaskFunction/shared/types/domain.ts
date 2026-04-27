/**
 * core domain models within tasksync
 */

export type UserRole = "owner" | "admin" | "member" | "viewer";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface User {
    userId: string;
    email: string; 
    displayName: string;
    createdAt: string;
}

export interface Workspace {
    workspaceId: string;
    name: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Membership {
    workspaceId: string;
    userId: string;
    role: UserRole; 
    joinedAt: string;
}

export interface Board {
    boardId: string;
    workspaceId: string;
    title: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskList {
    listId: string;
    boardId: string;
    title: string;
    position: number; 
    createdAt: string;
    updatedAt: string;
}

export interface Task{
    taskId: string;
    boardId: string;
    listId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    createdBy: string;
    priority: TaskPriority;
    status: TaskPriority;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    commentId: string;
    taskId: string;
    authorId: string;
    body: string;
    createdAt: string;
}