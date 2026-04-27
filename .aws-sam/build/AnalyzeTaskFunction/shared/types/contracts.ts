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

export interface CreateWorkspaceResponse{
    workspace: Workspace;
    membership: Membership;
}

export interface ListWorkspacesResponse{
    worksapces: Workspace[];
}

export interface CreateBoardRequest{
    workspaceId: string;
    title: string;
}

export interface CreateBoardResponse{
    board: Board; 
    defaultLists: TaskList[];
}

export interface ListBoardsResponse{
    boards: Board[]
}

export interface CreateTaskListRequest{
    boardId: string;
    title: string;
    position: number;
}

export interface CreateTaskListResponse{
    list: TaskList;
}

export interface CreateTaskRequest{
    boardId: string;
    listId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    priority?: TaskPriority;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface MoveTaskRequest {
  taskId: string;
  sourceListId: string;
  targetListId: string;
  newPosition: number;
}

export interface CreateTaskResponse {
  task: Task;
}

export interface UpdateTaskResponse {
  task: Task;
}

export interface BoardTasksResponse {
  tasks: Task[];
  lists: TaskList[];
}

/* Comment contracts */

export interface CreateCommentRequest {
  taskId: string;
  body: string;
}

export interface CreateCommentResponse {
  comment: Comment;
}

export interface TaskCommentsResponse {
  comments: Comment[];
}

export interface AddWorkspaceMemberRequest {
  workspaceId: string;
  userId: string;
  role: UserRole;
}

export interface AddWorkspaceMemberResponse {
  membership: Membership;
}

export interface WorkspaceMembersResponse {
  members: Membership[];
}