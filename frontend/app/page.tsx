"use client";

import { useEffect, useState } from "react";
import {
  addWorkspaceMember,
  createBoard,
  createComment,
  createTask,
  createUser,
  createWorkspace,
  getBoard,
  getComments,
  getWorkspaceMembers,
  updateTask,
} from "../lib/api";

type BoardItem = {
  PK: string;
  SK: string;
  boardId?: string;
  taskId?: string;
  status?: string;
  name?: string;
  title?: string;
  description?: string;
  columnId?: string;
  position?: number;
  createdAt?: string;
  userId?: string;
  role?: string;
};

type CommentItem = {
  commentId: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt: string;
};

const columns = [
  { id: "todo", label: "Todo" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

export default function Home() {
  const [realtimeStatus, setRealtimeStatus] = useState("Disconnected");
  const [boardId, setBoardId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [userId, setUserId] = useState("");
  const [members, setMembers] = useState<BoardItem[]>([]);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [commentsByTask, setCommentsByTask] = useState<
    Record<string, CommentItem[]>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );

  const refreshCommentsForTasks = async (tasksToLoad: BoardItem[]) => {
    const nextComments: Record<string, CommentItem[]> = {};

    await Promise.all(
      tasksToLoad.map(async (task) => {
        if (!task.taskId) return;
        const comments = await getComments(task.taskId);
        nextComments[task.taskId] = comments;
      })
    );

    setCommentsByTask(nextComments);
  };

  const refreshBoard = async (id: string) => {
    const items = await getBoard(id);
    setBoardItems(items);

    const loadedTasks = items.filter((item: BoardItem) =>
      item.SK.startsWith("TASK#")
    );

    await refreshCommentsForTasks(loadedTasks);
  };

  useEffect(() => {
    const savedWorkspace = localStorage.getItem("tasksync-workspace-id");
    const savedBoard = localStorage.getItem("tasksync-board-id");
    const savedUser = localStorage.getItem("tasksync-user-id");

    if (savedUser) setUserId(savedUser);

    if (savedWorkspace) {
      setWorkspaceId(savedWorkspace);
      getWorkspaceMembers(savedWorkspace).then(setMembers);
    }

    if (savedBoard) {
      setBoardId(savedBoard);
      refreshBoard(savedBoard);
    }
  }, []);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    if (!wsUrl) return;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setRealtimeStatus("Connected");
      console.log("WebSocket connected");
    };

    socket.onclose = () => {
      setRealtimeStatus("Disconnected");
      console.log("WebSocket disconnected");
    };

    socket.onerror = (error) => {
      setRealtimeStatus("Error");
      console.error("WebSocket error:", error);
    };

    socket.onmessage = (event) => {
      console.log("WebSocket message:", event.data);
    };

    return () => {
      socket.close();
    };
  }, []);

  const ensureDemoUser = async () => {
    let currentUserId = userId;

    if (!currentUserId) {
      const user = await createUser({
        name: "Adi",
        email: "adi@example.com",
      });

      currentUserId = user.userId;
      setUserId(currentUserId);
      localStorage.setItem("tasksync-user-id", currentUserId);
    }

    return currentUserId;
  };

  const handleCreateBoard = async () => {
    setLoading(true);

    let wsId = workspaceId;
    const currentUserId = await ensureDemoUser();

    if (!wsId) {
      const ws = await createWorkspace("Adi Workspace");
      wsId = ws.workspaceId;

      setWorkspaceId(wsId);
      localStorage.setItem("tasksync-workspace-id", wsId);

      await addWorkspaceMember(wsId, {
        userId: currentUserId,
        role: "owner",
      });

      const workspaceMembers = await getWorkspaceMembers(wsId);
      setMembers(workspaceMembers);
    }

    const board = await createBoard(wsId, "Adi's First Board");

    setBoardId(board.boardId);
    localStorage.setItem("tasksync-board-id", board.boardId);

    await refreshBoard(board.boardId);
    setLoading(false);
  };
/** 
  const handleCreateTask = async () => {
    if (!boardId || !taskTitle.trim()) return;

    setLoading(true);

    await createTask(boardId, {
      title: taskTitle,
      description: "",
      columnId: "todo",
      position: 0,
    });

    setTaskTitle("");
    await refreshBoard(boardId);
    setLoading(false);
  };
*/

  const handleCreateTask = async () => {
    if (!boardId || !taskTitle.trim()) return;

    setLoading(true);

    const createdTask = await createTask(boardId, {
      title: taskTitle,
      description: "",
      columnId: "todo",
      position: 0,
    });

    //console.log("Created task:", createdTask);

    setTaskTitle("");

    const refreshedItems = await getBoard(boardId);
    console.log("Refreshed board items:", refreshedItems);

    setBoardItems(refreshedItems);

    setLoading(false);
  };

  const handleMoveTask = async (task: BoardItem, newColumnId: string) => {
    if (!boardId || !task.taskId || !task.title) return;

    setLoading(true);

    const updated = await updateTask(boardId, task.taskId, {
      title: task.title,
      description: task.description || "",
      columnId: newColumnId,
      status: newColumnId,
      position: task.position ?? 0,
    });

    console.log("Update response:", updated);

    await refreshBoard(boardId);
    setLoading(false);
  };

  const handleAddComment = async (task: BoardItem) => {
    if (!task.taskId || !userId) return;

    const commentBody = commentInputs[task.taskId]?.trim();
    if (!commentBody) return;

    setLoading(true);

    await createComment(task.taskId, {
      userId,
      body: commentBody,
    });

    setCommentInputs((prev) => ({
      ...prev,
      [task.taskId!]: "",
    }));

    const comments = await getComments(task.taskId);

    setCommentsByTask((prev) => ({
      ...prev,
      [task.taskId!]: comments,
    }));

    setLoading(false);
  };

  const handleClearBoard = () => {
    localStorage.removeItem("tasksync-board-id");
    localStorage.removeItem("tasksync-workspace-id");
    localStorage.removeItem("tasksync-user-id");

    setBoardId("");
    setWorkspaceId("");
    setUserId("");
    setMembers([]);
    setTaskTitle("");
    setBoardItems([]);
    setCommentsByTask({});
    setCommentInputs({});
  };

  const boardMetadata = boardItems.find((item) => item.SK === "METADATA");
  const tasks = boardItems.filter(
    (item) => item.SK && item.SK.startsWith("TASK#")
  );
  const getTaskColumnId = (task: BoardItem) => {
    return task.columnId || task.status || "todo";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f7fb",
        padding: "40px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#111827",
      }}
    >
      <section style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#6366f1",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              TaskSync AI
            </p>

            <h1 style={{ margin: "8px 0", fontSize: 42, lineHeight: 1.1 }}>
              Serverless task management.
            </h1>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: 16,
                maxWidth: 620,
              }}
            >
              Create boards, add tasks, move work across columns, and comment
              on task activity using a deployed AWS Lambda, API Gateway, and
              DynamoDB backend.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleCreateBoard}
              disabled={loading}
              style={{
                border: "none",
                background: "#111827",
                color: "white",
                padding: "10px 16px",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "Loading..." : "Create Board"}
            </button>

            {boardId && (
              <button
                onClick={handleClearBoard}
                disabled={loading}
                style={{
                  border: "1px solid #d1d5db",
                  background: "white",
                  color: "#374151",
                  padding: "10px 16px",
                  borderRadius: 10,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                Clear Board
              </button>
            )}
          </div>
        </div>

        {boardId ? (
          <section>
            <div
              style={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 24 }}>
                {boardMetadata?.name || "Current Board"}
              </h2>

              <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 13 }}>
                Board ID: {boardId}
              </p>

              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Workspace ID: {workspaceId}
              </p>

              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Demo User ID: {userId || "Not created yet"}
              </p>

              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Members: {members.length}
              </p>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                Realtime: {realtimeStatus}
              </p>

              <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTask();
                  }}
                  placeholder="Add a new task..."
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    fontSize: 15,
                    outline: "none",
                  }}
                />

                <button
                  onClick={handleCreateTask}
                  disabled={loading || !taskTitle.trim()}
                  style={{
                    border: "none",
                    background:
                      loading || !taskTitle.trim() ? "#9ca3af" : "#4f46e5",
                    color: "white",
                    padding: "12px 18px",
                    borderRadius: 10,
                    cursor:
                      loading || !taskTitle.trim() ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 20,
              }}
            >
              {columns.map((column) => {
                const columnTasks = tasks.filter((task) => {
                  return getTaskColumnId(task) === column.id;
                });

                return (
                  <div
                    key={column.id}
                    style={{
                      background: "#eef0f6",
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: 16,
                      minHeight: 360,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        {column.label}
                      </h3>

                      <span
                        style={{
                          background: "white",
                          border: "1px solid #d1d5db",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 12,
                          color: "#6b7280",
                          fontWeight: 700,
                        }}
                      >
                        {columnTasks.length}
                      </span>
                    </div>

                    {columnTasks.length === 0 && (
                      <p
                        style={{
                          color: "#9ca3af",
                          fontSize: 14,
                          marginTop: 24,
                        }}
                      >
                        No tasks yet.
                      </p>
                    )}

                    {columnTasks.map((task) => (
                      <div
                        key={task.taskId}
                        style={{
                          background: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 14,
                          marginTop: 12,
                          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: 15,
                            marginBottom: 8,
                          }}
                        >
                          {task.title}
                        </strong>

                        <p
                          style={{
                            margin: 0,
                            color: "#9ca3af",
                            fontSize: 12,
                          }}
                        >
                          Status: {column.label}
                        </p>

                        <div
                          style={{
                            marginTop: 14,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                          }}
                        >
                          {columns
                            .filter((target) => target.id !== getTaskColumnId(task))
                            .map((target) => (
                              <button
                                key={target.id}
                                onClick={() => handleMoveTask(task, target.id)}
                                disabled={loading}
                                style={{
                                  border: "1px solid #d1d5db",
                                  background: "white",
                                  color: "#374151",
                                  borderRadius: 999,
                                  padding: "6px 10px",
                                  fontSize: 12,
                                  cursor: loading ? "not-allowed" : "pointer",
                                }}
                              >
                                Move to {target.label}
                              </button>
                            ))}
                        </div>

                        <div style={{ marginTop: 14 }}>
                          <input
                            value={commentInputs[task.taskId || ""] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [task.taskId || ""]: e.target.value,
                              }))
                            }
                            placeholder="Add a comment..."
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              border: "1px solid #d1d5db",
                              borderRadius: 8,
                              fontSize: 13,
                              boxSizing: "border-box",
                            }}
                          />

                          <button
                            onClick={() => handleAddComment(task)}
                            disabled={loading || !task.taskId || !userId}
                            style={{
                              marginTop: 8,
                              border: "none",
                              background: "#111827",
                              color: "white",
                              borderRadius: 8,
                              padding: "7px 10px",
                              fontSize: 12,
                              cursor: loading ? "not-allowed" : "pointer",
                            }}
                          >
                            Comment
                          </button>

                          {(commentsByTask[task.taskId || ""] || []).length >
                            0 && (
                            <div style={{ marginTop: 10 }}>
                              {(commentsByTask[task.taskId || ""] || []).map(
                                (comment) => (
                                  <div
                                    key={comment.commentId}
                                    style={{
                                      background: "#f9fafb",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: 8,
                                      padding: 8,
                                      marginTop: 6,
                                      fontSize: 12,
                                    }}
                                  >
                                    <strong>
                                      {comment.userId.slice(0, 8)}
                                    </strong>
                                    : {comment.body}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 32,
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>No active board yet</h2>
            <p style={{ color: "#6b7280", marginBottom: 0 }}>
              Create a board to start adding and moving tasks.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}