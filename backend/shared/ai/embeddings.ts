export async function getEmbedding(text: string): Promise<number[]> {
  const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

  const res = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(text),
    }
  );

  const data = await res.json();

  // model returns 2D array now flatten
  return data[0];
}