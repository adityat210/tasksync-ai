const API_URL = process.env.NEXT_PUBLIC_API_URL!;

//export async function createBoard(name: string) {
  //const res = await fetch(`${API_URL}/boards`, {
   // method: "POST",
   // headers: {
     // "Content-Type": "application/json",
    //},
   // body: JSON.stringify({ name }),
  //});

  //return await res.json();
//}

export async function getBoard(boardId: string) {
  const res = await fetch(`${API_URL}/boards/${boardId}`);
  return await res.json();
}

export async function createTask(
  boardId: string,
  task: {
    title: string;
    description?: string;
    columnId?: string;
    status?: string;
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

  return await res.json();
}

export async function updateTask(
    boardId: string,
    taskId: string,
    task: {
        title: string;
        description?: string;
        columnId: string;   
        position?: number;
    }
) 
{
    const res = await fetch(`${API_URL}/boards/${boardId}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
    });

    return await res.json();
}

//creating the workspace
export async function createWorkspace(name: string) {
  const res = await fetch(`${API_URL}/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  return res.json();
}

//creating the board inside the workspace
export async function createBoard(workspaceId: string, name: string) {
  const res = await fetch(
    `${API_URL}/workspaces/${workspaceId}/boards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }
  );

  return res.json();
}

export async function createUser(user: { name: string; email: string }) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  return await res.json();
}

export async function addWorkspaceMember(
  workspaceId: string,
  member: { userId: string; role: string }
) {
  const res = await fetch(`${API_URL}/workspaces/${workspaceId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(member),
  });

  return await res.json();
}

export async function getWorkspaceMembers(workspaceId: string) {
  const res = await fetch(`${API_URL}/workspaces/${workspaceId}/members`);
  return await res.json();
}

export async function createComment(
  taskId: string,
  comment: {
    userId: string;
    body: string;
  }
) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(comment),
  });

  return await res.json();
}

export async function getComments(taskId: string) {
  const res = await fetch(`${API_URL}/tasks/${taskId}/comments`);
  return await res.json();
}