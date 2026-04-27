import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const TABLE_NAME = "TaskSyncTable";
const REGION = "us-west-2";

const client = new DynamoDBClient({ region: REGION });
const db = DynamoDBDocumentClient.from(client);

const statuses = ["todo", "in-progress", "done"];
const priorities = ["low", "medium", "high"];

const taskGroups = [
  ["Fix login bug", "Resolve authentication issue", "Debug sign-in failure"],
  ["Improve search relevance", "Tune task ranking", "Refine search results"],
  ["Add loading states", "Implement loading indicators", "Polish async UI states"],
  ["Create mobile layout", "Build responsive board view", "Improve mobile task cards"],
  ["Review WebSocket sync", "Debug realtime updates", "Improve cross-client refresh"],
  ["Add duplicate detection", "Detect similar tasks", "Flag repeated task requests"],
  ["Write deployment docs", "Document SAM deploy flow", "Create backend setup guide"],
  ["Polish task cards", "Improve task card design", "Refine board UI styling"],
  ["Test workspace invites", "Validate workspace membership flow", "Review shared workspace access"],
  ["Fix API error handling", "Improve Lambda error responses", "Standardize API failure states"],
];

const commentTemplates = [
  "Looks good, moving this forward.",
  "Can we revisit the edge case here?",
  "I added context from the last meeting.",
  "This is related to the onboarding flow.",
  "Potential duplicate of another task.",
  "Needs review before shipping.",
  "This should be prioritized for the demo.",
  "Adding notes for the next sprint.",
  "This overlaps with a similar workspace issue.",
  "Search should make this easier to find later.",
];

async function put(item: Record<string, unknown>) {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function main() {
  const users = Array.from({ length: 6 }, (_, i) => ({
    userId: randomUUID(),
    name: `Demo User ${i + 1}`,
    email: `demo${i + 1}@tasksync.dev`,
  }));

  const workspaces = Array.from({ length: 3 }, (_, i) => ({
    workspaceId: randomUUID(),
    name: `Demo Workspace ${i + 1}`,
  }));

  console.log("Seeding realistic users...");

  for (const user of users) {
    await put({
      PK: `USER#${user.userId}`,
      SK: "METADATA",
      ...user,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
    });
  }

  console.log("Seeding workspaces, memberships, boards, tasks, comments...");

  let boardCount = 0;
  let taskCount = 0;
  let commentCount = 0;
  let duplicateLikeTaskCount = 0;

  for (let w = 0; w < workspaces.length; w++) {
    const workspace = workspaces[w];

    await put({
      PK: `WORKSPACE#${workspace.workspaceId}`,
      SK: "METADATA",
      ...workspace,
      createdAt: daysAgo(28 - w),
      updatedAt: daysAgo(3),
    });

    for (let u = 0; u < users.length; u++) {
      await put({
        PK: `WORKSPACE#${workspace.workspaceId}`,
        SK: `MEMBER#${users[u].userId}`,
        workspaceId: workspace.workspaceId,
        userId: users[u].userId,
        role: u === 0 ? "owner" : "member",
        createdAt: daysAgo(27 - w),
      });
    }

    const boardsInWorkspace = w === 0 ? 2 : w === 1 ? 2 : 1;

    for (let b = 0; b < boardsInWorkspace; b++) {
      const boardId = randomUUID();
      boardCount++;

      await put({
        PK: `WORKSPACE#${workspace.workspaceId}`,
        SK: `BOARD#${boardId}`,
        boardId,
        workspaceId: workspace.workspaceId,
        name: `Project Board ${boardCount}`,
        createdAt: daysAgo(21 - b),
        updatedAt: daysAgo(1),
      });

      const tasksPerBoard = 50;

      for (let t = 0; t < tasksPerBoard; t++) {
        const taskId = randomUUID();
        const group = taskGroups[t % taskGroups.length];
        const title = group[t % group.length];

        if (t % group.length !== 0) {
          duplicateLikeTaskCount++;
        }

        const status = statuses[t % statuses.length];
        const priority = priorities[t % priorities.length];

        const tags = [
          t % 2 === 0 ? "frontend" : "backend",
          t % 3 === 0 ? "urgent" : "normal",
          t % 5 === 0 ? "search" : "workflow",
        ];

        const createdAt = daysAgo((t % 25) + 1);
        const updatedAt = daysAgo(t % 7);

        taskCount++;

        await put({
          PK: `BOARD#${boardId}`,
          SK: `TASK#${taskId}`,
          taskId,
          boardId,
          workspaceId: workspace.workspaceId,

          title,
          description: `Seeded task ${taskCount} for search, recommendation, and duplicate-detection evaluation.`,

          status,
          columnId: status,
          priority,
          tags,

          assigneeUserId: users[t % users.length].userId,
          createdByUserId: users[(t + b) % users.length].userId,
          position: t,

          createdAt,
          updatedAt,
        });

        const commentsPerTask = t % 2 === 0 ? 2 : 1;

        for (let c = 0; c < commentsPerTask; c++) {
          const commentId = randomUUID();
          const baseComment = commentTemplates[(t + c) % commentTemplates.length];

          const commentBody =
            baseComment +
            (t % 6 === 0
              ? " This may be related to another duplicate task."
              : "");

          commentCount++;

          await put({
            PK: `TASK#${taskId}`,
            SK: `COMMENT#${daysAgo((t + c) % 14)}#${commentId}`,
            commentId,
            taskId,
            boardId,
            workspaceId: workspace.workspaceId,
            userId: users[(t + c) % users.length].userId,
            body: commentBody,
            createdAt: daysAgo((t + c) % 14),
          });
        }

        if (t % 10 === 0) {
          await put({
            PK: `BOARD#${boardId}`,
            SK: `ACTIVITY#${updatedAt}#${randomUUID()}`,
            boardId,
            workspaceId: workspace.workspaceId,
            taskId,
            userId: users[t % users.length].userId,
            type: "TASK_MOVED",
            fromColumn: "todo",
            toColumn: status,
            createdAt: updatedAt,
          });
        }
      }
    }
  }

  const totalRecords =
    users.length +
    workspaces.length +
    workspaces.length * users.length +
    boardCount +
    taskCount +
    commentCount;

  console.log("Seed complete.");
  console.log({
    users: users.length,
    workspaces: workspaces.length,
    boards: boardCount,
    tasks: taskCount,
    comments: commentCount,
    duplicateLikeTasks: duplicateLikeTaskCount,
    totalRecords,
  });
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});