import type {
    Board, Comment, Membership, Task, TaskList, TaskPriority, TaskStatus, UserRole, Workspace
} from "./domain"

/**
 * domain models describe what the saved objects look like
 * contract types describe what clients send to the API and what handlers return
 * 
 */

export interface CreateWorkspaceRequest{
    name: string;
}