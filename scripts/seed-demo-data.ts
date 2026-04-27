import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const TABLE_NAME = "TaskSyncTable";
const REGION = "us-west-2";

const client = new DynamoDBClient({ region: REGION });
const db = DynamoDBDocumentClient.from(client);

const statuses = ["todo", "in-progress", "done"];

const taskTitles = [
  "Design dashboard layout",
  "Fix API error handling",
  "Add loading states",
  "Write onboarding copy",
  "Review analytics events",
  "Implement task filters",
  "Refactor board state",
  "Add comment threading",
  "Create mobile layout",
  "Test workspace invites",
  "Improve search relevance",
  "Add duplicate detection",
  "Write deployment docs",
  "Polish task cards",
  "Review WebSocket sync",
];

const comments = [
  "Looks good, moving this forward.",
  "Can we revisit the edge case here?",
  "I added context from the last meeting.",
  "This is related to the onboarding flow.",
  "Potential duplicate of another task.",
  "Needs review before shipping.",
  "This should be prioritized for the demo.",
  "Adding notes for the next sprint.",
];

async function put(item: Record<string, unknown>) {
  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}

async function main() {
  const now = new Date().toISOString();

  const users = Array.from({ length: 6 }, (_, i) => ({
    userId: randomUUID(),
    name: `Demo User ${i + 1}`,
    email: `demo${i + 1}@tasksync.dev`,
  }));

  const workspaces = Array.from({ length: 3 }, (_, i) => ({
    workspaceId: randomUUID(),
    name: `Demo Workspace ${i + 1}`,
  }));

  console.log("Seeding users...");

  for (const user of users) {
    await put({
      PK: `USER#${user.userId}`,
      SK: "METADATA",
      ...user,
      createdAt: now,
      updatedAt: now,
    });
  }

  console.log("Seeding workspaces, memberships, boards, tasks, comments...");

  let taskCount = 0;
  let commentCount = 0;
  let boardCount = 0;

  for (let w = 0; w < workspaces.length; w++) {
    const workspace = workspaces[w];

    await put({
      PK: `WORKSPACE#${workspace.workspaceId}`,
      SK: "METADATA",
      ...workspace,
      createdAt: now,
      updatedAt: now,
    });

    for (let u = 0; u < users.length; u++) {
      await put({
        PK: `WORKSPACE#${workspace.workspaceId}`,
        SK: `MEMBER#${users[u].userId}`,
        workspaceId: workspace.workspaceId,
        userId: users[u].userId,
        role: u === 0 ? "owner" : "member",
        createdAt: now,
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
        createdAt: now,
        updatedAt: now,
      });

      const tasksPerBoard = 50;

      for (let t = 0; t < tasksPerBoard; t++) {
        const taskId = randomUUID();
        const status = statuses[t % statuses.length];
        const title = `${taskTitles[t % taskTitles.length]} ${t + 1}`;

        taskCount++;

        await put({
          PK: `BOARD#${boardId}`,
          SK: `TASK#${taskId}`,
          taskId,
          boardId,
          workspaceId: workspace.workspaceId,
          title,
          description: `Seeded task ${taskCount} for simulated collaboration and search evaluation.`,
          status,
          columnId: status,
          assigneeUserId: users[t % users.length].userId,
          position: t,
          createdAt: now,
          updatedAt: now,
          tags: [
            t % 2 === 0 ? "frontend" : "backend",
            t % 3 === 0 ? "urgent" : "normal",
          ],
        });

        const commentsPerTask = t % 2 === 0 ? 2 : 1;

        for (let c = 0; c < commentsPerTask; c++) {
          const commentId = randomUUID();
          commentCount++;

          await put({
            PK: `TASK#${taskId}`,
            SK: `COMMENT#${new Date().toISOString()}#${commentId}`,
            commentId,
            taskId,
            userId: users[(t + c) % users.length].userId,
            body: comments[(t + c) % comments.length],
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  console.log("Seed complete.");
  console.log({
    users: users.length,
    workspaces: workspaces.length,
    boards: boardCount,
    tasks: taskCount,
    comments: commentCount,
    totalRecords:
      users.length +
      workspaces.length +
      workspaces.length * users.length +
      boardCount +
      taskCount +
      commentCount,
  });
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});