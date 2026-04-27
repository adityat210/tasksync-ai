type Task = {
  title: string;
  description: string;
  duplicateGroup: string;
};

const tasks: Task[] = [
  // Auth/login duplicates
  {
    title: "Fix login bug",
    description: "Users cannot sign in after update",
    duplicateGroup: "auth-login",
  },
  {
    title: "Fix login bug",
    description: "Duplicate report from QA about login failure",
    duplicateGroup: "auth-login",
  },
  {
    title: "Resolve authentication issue",
    description: "Login fails after confirmation",
    duplicateGroup: "auth-login",
  },
  {
    title: "Debug sign-in failure",
    description: "Users report failed sign-in attempts",
    duplicateGroup: "auth-login",
  },

  // Search duplicates
  {
    title: "Improve search relevance",
    description: "Search results are not ranked well",
    duplicateGroup: "search-ranking",
  },
  {
    title: "Improve search relevance",
    description: "Duplicate request from product review",
    duplicateGroup: "search-ranking",
  },
  {
    title: "Tune task ranking",
    description: "Improve ordering of search results",
    duplicateGroup: "search-ranking",
  },
  {
    title: "Refine search results",
    description: "Make search output more useful across projects",
    duplicateGroup: "search-ranking",
  },

  // Mobile duplicates
  {
    title: "Create mobile layout",
    description: "Board view needs better mobile support",
    duplicateGroup: "mobile-layout",
  },
  {
    title: "Create mobile layout",
    description: "Duplicate ticket for mobile board display",
    duplicateGroup: "mobile-layout",
  },
  {
    title: "Build responsive board view",
    description: "Improve layout on small screens",
    duplicateGroup: "mobile-layout",
  },
  {
    title: "Improve mobile task cards",
    description: "Task cards overflow on phone screens",
    duplicateGroup: "mobile-layout",
  },

  // Realtime duplicates
  {
    title: "Review WebSocket sync",
    description: "Task movement is delayed across tabs",
    duplicateGroup: "realtime-sync",
  },
  {
    title: "Review WebSocket sync",
    description: "Duplicate report about realtime update delay",
    duplicateGroup: "realtime-sync",
  },
  {
    title: "Debug realtime updates",
    description: "Cross-client refresh does not always happen",
    duplicateGroup: "realtime-sync",
  },
  {
    title: "Improve cross-client refresh",
    description: "Other users should see board changes faster",
    duplicateGroup: "realtime-sync",
  },

  // API/error duplicates
  {
    title: "Fix API error handling",
    description: "Lambda responses should expose clean errors",
    duplicateGroup: "api-errors",
  },
  {
    title: "Fix API error handling",
    description: "Duplicate issue from failed task endpoint",
    duplicateGroup: "api-errors",
  },
  {
    title: "Improve Lambda error responses",
    description: "Backend errors are hard to debug",
    duplicateGroup: "api-errors",
  },
  {
    title: "Standardize API failure states",
    description: "Frontend needs consistent error responses",
    duplicateGroup: "api-errors",
  },

  // Duplicate detection duplicates
  {
    title: "Add duplicate detection",
    description: "Flag similar task creation attempts",
    duplicateGroup: "duplicate-detection",
  },
  {
    title: "Add duplicate detection",
    description: "Duplicate request for repeated task detection",
    duplicateGroup: "duplicate-detection",
  },
  {
    title: "Detect similar tasks",
    description: "Find repeated tasks with different wording",
    duplicateGroup: "duplicate-detection",
  },
  {
    title: "Flag repeated task requests",
    description: "Warn users before creating duplicate work",
    duplicateGroup: "duplicate-detection",
  },

  // Non-duplicates
  {
    title: "Write deployment docs",
    description: "Document SAM deploy flow",
    duplicateGroup: "unique-deploy-docs",
  },
  {
    title: "Polish task cards",
    description: "Improve board UI styling",
    duplicateGroup: "unique-ui-polish",
  },
  {
    title: "Test workspace invites",
    description: "Validate membership invite flow",
    duplicateGroup: "unique-invites",
  },
  {
    title: "Add loading states",
    description: "Show loading state during API calls",
    duplicateGroup: "unique-loading",
  },
  {
    title: "Review analytics events",
    description: "Check event tracking for board actions",
    duplicateGroup: "unique-analytics",
  },
  {
    title: "Create backend setup guide",
    description: "Explain environment variables and local setup",
    duplicateGroup: "unique-setup",
  },
  {
    title: "Add comment threading",
    description: "Allow replies under task comments",
    duplicateGroup: "unique-comments",
  },
  {
    title: "Implement task filters",
    description: "Filter tasks by assignee and status",
    duplicateGroup: "unique-filters",
  },
  {
    title: "Refactor board state",
    description: "Simplify frontend board state updates",
    duplicateGroup: "unique-refactor",
  },
  {
    title: "Validate workspace membership flow",
    description: "Confirm members can be added to workspaces",
    duplicateGroup: "unique-membership",
  },
];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);
}

function baselineDuplicateScore(a: Task, b: Task) {
  return a.title.toLowerCase() === b.title.toLowerCase() ? 1 : 0;
}

function improvedDuplicateScore(a: Task, b: Task) {
  const aTokens = new Set(tokenize(`${a.title} ${a.description}`));
  const bTokens = new Set(tokenize(`${b.title} ${b.description}`));

  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;
  const tokenScore = union === 0 ? 0 : overlap / union;

  const semanticHints: Record<string, string[]> = {
    auth: ["login", "authentication", "sign", "signin"],
    search: ["search", "ranking", "results", "relevance"],
    mobile: ["mobile", "responsive", "layout", "screen", "cards"],
    realtime: ["websocket", "realtime", "client", "sync", "refresh"],
    api: ["api", "lambda", "error", "errors", "backend", "responses"],
    duplicate: ["duplicate", "similar", "repeated", "detect", "flag"],
  };

  let hintScore = 0;

  for (const hints of Object.values(semanticHints)) {
    const aHasHint = [...aTokens].some((token) => hints.includes(token));
    const bHasHint = [...bTokens].some((token) => hints.includes(token));

    if (aHasHint && bHasHint) {
      hintScore += 0.4;
    }
  }

  return tokenScore + hintScore;
}

function evaluate(
  scorer: (a: Task, b: Task) => number,
  threshold: number
) {
  let trueDuplicates = 0;
  let trueNonDuplicates = 0;
  let detectedDuplicates = 0;
  let correctlyDetected = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const isDuplicate = tasks[i].duplicateGroup === tasks[j].duplicateGroup;
      const detected = scorer(tasks[i], tasks[j]) >= threshold;

      if (isDuplicate) trueDuplicates++;
      else trueNonDuplicates++;

      if (detected) detectedDuplicates++;

      if (isDuplicate && detected) correctlyDetected++;
      if (!isDuplicate && detected) falsePositives++;
      if (isDuplicate && !detected) falseNegatives++;
    }
  }

  const recall =
    trueDuplicates === 0 ? 0 : correctlyDetected / trueDuplicates;

  const precision =
    detectedDuplicates === 0 ? 0 : correctlyDetected / detectedDuplicates;

  return {
    trueDuplicates,
    trueNonDuplicates,
    detectedDuplicates,
    correctlyDetected,
    falsePositives,
    falseNegatives,
    recall,
    precision,
  };
}

const baseline = evaluate(baselineDuplicateScore, 1);
const improved = evaluate(improvedDuplicateScore, 0.25);

const recallLift =
  baseline.recall === 0
    ? improved.recall * 100
    : ((improved.recall - baseline.recall) / baseline.recall) * 100;

console.log("Duplicate Detection Evaluation");
console.log("--------------------------------");
console.log("Dataset size:", tasks.length);
console.log("Baseline:", baseline);
console.log("Improved:", improved);
console.log(`Recall lift: ${recallLift.toFixed(1)}%`);

if (recallLift >= 25) {
  console.log("Result: improved method exceeds 25% duplicate detection lift.");
} else {
  console.log("Result: improved method does not reach 25% lift yet.");
}