import Groq from "groq-sdk";
import { env } from "~/env";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export async function generateAnswerWithGroq(params: {
  question: string;
  context: string;
}): Promise<string> {
  const { question, context } = params;
  const system = `You are AuriVault, a secure RAG assistant. Answer ONLY using the provided context. If the context is insufficient, say you don't know. Always list citations as [doc:id] markers if available.`;
  const prompt = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 600,
  });
  return res.choices?.[0]?.message?.content ?? "";
}


