/**
 * documenting key patterns we want to use so handlers easier to implement
 */

export type EntityType = 
| "USER"
| "WORKSPACE"
| "MEMBERSHIP"
| "BOARD"
| "LIST"
| "TASK"
| "COMMENT";

/* base shapes for records in dynamo */
export interface DynamoRecord {
  PK: string;
  SK: string;
  entityType: EntityType;
}

/*helpers keeping strings formattedly as expected*/
export const keys = {
    userPk: (userId: string) => `USER#${userId}`,
    workspacePk: (workspaceId: string) => `WORKSPACE#${workspaceId}`,
    workspaceMetadataSk: () => "METADATA", 
    membershipSk: (userId: string) => `MEMBER#${userId}`,
    boardSk: (boardId: string) => `BOARD#${boardId}`,
    boardPk: (boardId: string) => `BOARD#${boardId}`,
    listSk: (listId: string) => `LIST#${listId}`,
    taskSk: (taskId: string) => `TASK#${taskId}`,
    taskPk: (taskId: string) => `TASK#${taskId}`,
    commentSk: (createdAt: string, commentId: string) =>
    `COMMENT#${createdAt}#${commentId}`
};