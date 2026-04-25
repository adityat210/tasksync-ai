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

import { useState } from "react";
import { createBoard, getBoard } from "../lib/api";

type BoardItem = {
  PK: string;
  SK: string;
  boardId?: string;
  name?: string;
  createdAt?: string;
};

export default function Home() {
  const [boardId, setBoardId] = useState("");
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateBoard = async () => {
    setLoading(true);

    const board = await createBoard("My First Board");

    setBoardId(board.boardId);

    const items = await getBoard(board.boardId);
    setBoardItems(items);

    setLoading(false);
  };

  return (
    <main style={{ padding: 32 }}>
      <h1>TaskSync</h1>

      <button onClick={handleCreateBoard} disabled={loading}>
        {loading ? "Creating..." : "Create Board"}
      </button>

      {boardId && (
        <section style={{ marginTop: 24 }}>
          <h2>Current Board</h2>
          <p>
            <strong>Board ID:</strong> {boardId}
          </p>

          <div style={{ marginTop: 16 }}>
            {boardItems.map((item) => (
              <div
                key={`${item.PK}-${item.SK}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <p>
                  <strong>Name:</strong> {item.name}
                </p>
                <p>
                  <strong>Type:</strong> {item.SK}
                </p>
                <p>
                  <strong>Created:</strong> {item.createdAt}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}