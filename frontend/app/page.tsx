/**
 * landing page tentatively for scaffold
 * 


export default function HomePage(){
    return (
        <main className="page">
            <section className="hero">
                <p className="eyebrow">TaskSync AI</p>
                <h1 className="title">Serverless, AI-equipped task management application.</h1>
                <p className="description">Welcome to TaskSync AI, your ultimate task management solution. Our serverless architecture ensures seamless performance, while our AI capabilities help you stay organized and productive. Experience the future of task management with TaskSync AI.</p>
                <div className="card">
                    <h2>Get Started</h2>
                    <p>
                        Frontend and backend base in place, next will add API, entity modeling, authentication and taskboard's workflows
                    </p>
                </div>
            </section>
        </main>
    );
}
    */

"use client";

import { useEffect, useState } from "react";
import { createBoard, createTask, getBoard, updateTask } from "../lib/api";

type BoardItem = {
  PK: string;
  SK: string;
  boardId?: string;
  taskId?: string;
  name?: string;
  title?: string;
  description?: string;
  columnId?: string;
  position?: number;
  createdAt?: string;
};

export default function Home() {
  const [boardId, setBoardId] = useState("");
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshBoard = async (id: string) => {
    const items = await getBoard(id);
    setBoardItems(items);
  };

  useEffect(() => {
    const savedBoardId = localStorage.getItem("tasksync-board-id");

    if (savedBoardId) {
      setBoardId(savedBoardId);
      refreshBoard(savedBoardId);
    }
  }, []);

  const handleCreateBoard = async () => {
    setLoading(true);

    const board = await createBoard("Adi's First Board");

    setBoardId(board.boardId);
    localStorage.setItem("tasksync-board-id", board.boardId);

    await refreshBoard(board.boardId);

    setLoading(false);
  };

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

  const handleMoveTask = async (task: BoardItem, newColumnId: string) => {
    if (!boardId || !task.taskId || !task.title) return;

    setLoading(true);

    await updateTask(boardId, task.taskId, {
      title: task.title,
      description: task.description || "",
      columnId: newColumnId,
      position: task.position ?? 0,
    });

    await refreshBoard(boardId);

    setLoading(false);
  };

  const handleClearBoard = () => {
    localStorage.removeItem("tasksync-board-id");
    setBoardId("");
    setBoardItems([]);
  };

  const boardMetadata = boardItems.find((item) => item.SK === "METADATA");
  const tasks = boardItems.filter((item) => item.SK.startsWith("TASK#"));

  return (
    <main style={{ padding: 32 }}>
      <h1>TaskSync</h1>

      <button onClick={handleCreateBoard} disabled={loading}>
        {loading ? "Loading..." : "Create Board"}
      </button>

      {boardId && (
        <button
          onClick={handleClearBoard}
          disabled={loading}
          style={{ marginLeft: 8 }}
        >
          Clear Active Board
        </button>
      )}

      {boardId && (
        <section style={{ marginTop: 24 }}>
          <h2>{boardMetadata?.name || "Current Board"}</h2>

          <p>
            <strong>Board ID:</strong> {boardId}
          </p>

          <div style={{ marginTop: 24 }}>
            <h3>Add Task</h3>

            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              style={{
                padding: 8,
                marginRight: 8,
                border: "1px solid #ccc",
                borderRadius: 6,
              }}
            />

            <button onClick={handleCreateTask} disabled={loading}>
              Add Task
            </button>
          </div>

          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {["todo", "in-progress", "done"].map((column) => (
              <div
                key={column}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                  minHeight: 250,
                }}
              >
                <h3>
                  {column === "todo"
                    ? "Todo"
                    : column === "in-progress"
                    ? "In Progress"
                    : "Done"}
                </h3>

                {tasks
                  .filter((task) => task.columnId === column)
                  .map((task) => (
                    <div
                      key={task.taskId}
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 12,
                        background: "white",
                      }}
                    >
                      <strong>{task.title}</strong>

                      {task.description && <p>{task.description}</p>}

                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        {["todo", "in-progress", "done"]
                          .filter((targetColumn) => targetColumn !== task.columnId)
                          .map((targetColumn) => (
                            <button
                              key={targetColumn}
                              onClick={() => handleMoveTask(task, targetColumn)}
                              disabled={loading}
                              style={{
                                fontSize: 12,
                                padding: "4px 8px",
                              }}
                            >
                              Move to{" "}
                              {targetColumn === "todo"
                                ? "Todo"
                                : targetColumn === "in-progress"
                                ? "In Progress"
                                : "Done"}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}