import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";
import { redis } from "../../shared/cache/redis";

const TABLE_NAME = process.env.TABLE_NAME!;

function scoreTask(task: any, query: string) {
  const q = query.toLowerCase();

  let score = 0;

  const title = (task.title || "").toLowerCase();
  const description = (task.description || "").toLowerCase();
  const tags = Array.isArray(task.tags) ? task.tags.join(" ").toLowerCase() : "";
  const priority = (task.priority || "").toLowerCase();
  const status = (task.status || task.columnId || "").toLowerCase();

  if (title.includes(q)) score += 50;
  if (description.includes(q)) score += 20;
  if (tags.includes(q)) score += 15;
  if (priority.includes(q)) score += 8;
  if (status.includes(q)) score += 5;

  if (task.priority === "high") score += 5;
  if (task.status === "in-progress") score += 3;

  if (task.updatedAt) {
    const updated = new Date(task.updatedAt).getTime();
    const daysOld = (Date.now() - updated) / (1000 * 60 * 60 * 24);

    if (daysOld < 3) score += 5;
    else if (daysOld < 7) score += 3;
  }

  return score;
}

export const handler = createHandler(async (event) => {
  const query = event.queryStringParameters?.q || "";
  const workspaceId = event.queryStringParameters?.workspaceId;
  const cacheKey = `search:${workspaceId || "all"}:${query.toLowerCase()}`;
  if (!query.trim()) {
    return {
      error: "Missing search query",
    };
  }
  if (redis) {
    const cached = await redis.get(cacheKey);

  if (cached) {
    return {
      ...(cached as object),
      cacheHit: true,
    };
  }
}

  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :taskPrefix)",
      ExpressionAttributeValues: {
        ":taskPrefix": "TASK#",
      },
    })
  );

  const tasks = result.Items || [];

  const filteredTasks = workspaceId
    ? tasks.filter((task) => task.workspaceId === workspaceId)
    : tasks;

  const ranked = filteredTasks
    .map((task) => ({
      ...task,
      relevanceScore: scoreTask(task, query),
    }))
    .filter((task) => task.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 20);


  const response = {
  query,
  count: ranked.length,
  results: ranked,
  cacheHit: false,
};

  if (redis) {
    await redis.set(cacheKey, response, {
      ex: 60,
    });
  }

return response;
});