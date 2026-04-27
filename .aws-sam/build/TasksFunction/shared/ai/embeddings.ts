export async function getEmbedding(text: string): Promise<number[]> {
  const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

  if (!HF_TOKEN) {
    throw new Error("Missing HUGGINGFACE_API_TOKEN");
  }

  const res = await fetch(
    "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        options: {
          wait_for_model: true,
        },
      }),
    }
  );

  const raw = await res.text();

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error("Non-JSON Hugging Face response:", raw.slice(0, 300));
    throw new Error("Hugging Face returned non-JSON response");
  }

  if (!res.ok) {
    console.error("Hugging Face error:", data);
    throw new Error("Hugging Face embedding request failed");
  }

  if (Array.isArray(data) && typeof data[0] === "number") {
    return data as number[];
  }

  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0] as number[];
  }

  console.error("Unexpected embedding response:", data);
  throw new Error("Unexpected embedding response format");
}