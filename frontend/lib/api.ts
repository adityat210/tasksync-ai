const API_URL = process.env.NEXT_PUBLIC_API_URL!;

//Create board
export async function createBoard(name: string){
    const res = await fetch(`${API_URL}/boards` , {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
    });
    return res.json
}

//GET board Data 
export async function getBoard(boardId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}`);
  return res.json();
}

//CREATE tasks
export async function createTask(
  boardId: string,
  task: {
    title: string;
    description?: string;
    columnId?: string;
    position?: number;
  }
  ) {
  const res = await fetch(`${API_URL}/boards/${boardId}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  return res.json();
}