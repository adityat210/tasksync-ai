import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../../shared/db/client";
import { createHandler } from "../../shared/utils/handler";
import { getEmbedding } from "../../shared/ai/embeddings";
import { cosineSimilarity } from "../../shared/ai/similarity";

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = createHandler(async (event) => {
  const body = JSON.parse(event.body || "{}");

  const { workspaceId, title, description } = body;

  if (!title) {
    return { error: "Missing title" };
  }

  const queryText = `${title} ${description || ""}`;
  const queryLower = queryText.toLowerCase();

  //const queryEmbedding = await getEmbedding(queryText);

  const result = await db.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(SK, :taskPrefix)",
      ExpressionAttributeValues: {
        ":taskPrefix": "TASK#",
      },
    })
  );

  const tasks = (result.Items || []).filter(
    (task) => !workspaceId || task.workspaceId === workspaceId
  );

  const queryWords = queryLower
    .split(/\s+/)
    .filter((word: string) => word.length > 3);

  const candidates = tasks
    .filter((task) => {
      const text = `${task.title || ""} ${task.description || ""}`.toLowerCase();

      return queryWords.some((word: string) => text.includes(word));
    })
    .slice(0, 10);

  const scored = [];

  for (const task of candidates.slice(0, 5)) {
    const text = `${task.title || ""} ${task.description || ""}`.toLowerCase();

    const overlapScore = queryWords.filter((word: string) =>
        text.includes(word)
    ).length;

    scored.push({
        ...task,
        similarity: overlapScore / Math.max(queryWords.length, 1),
    });
  }

  const top = scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const suggestedTags: string[] = [];

  if (queryLower.includes("login") || queryLower.includes("auth")) {
    suggestedTags.push("auth");
  }

  if (queryLower.includes("bug") || queryLower.includes("fix")) {
    suggestedTags.push("bug");
  }

  if (queryLower.includes("ui") || queryLower.includes("frontend")) {
    suggestedTags.push("frontend");
  }

  if (queryLower.includes("api") || queryLower.includes("backend")) {
    suggestedTags.push("backend");
  }

  return {
    summary: title,
    suggestedTags,
    possibleDuplicates: top,
  };
});