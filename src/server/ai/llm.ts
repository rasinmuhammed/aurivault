import { env } from "~/env";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

const groq = new ChatGroq({ apiKey: env.GROQ_API_KEY, model: "llama-3.1-8b-instant", temperature: 0.2 });

const RAG_PROMPT = PromptTemplate.fromTemplate(
  `You are AuriVault, a secure RAG assistant.
Use ONLY the provided context to answer. If insufficient, say you don't know.
Cite sources as [doc:{{index}}] when possible.

Context:
{context}

Question: {question}

Answer:`
);

export async function generateAnswerWithGroq(params: { question: string; context: string }): Promise<string> {
  const chain = RunnableSequence.from([
    RAG_PROMPT,
    groq,
  ]);
  const res = await chain.invoke({ question: params.question, context: params.context });
  const content = (res as any)?.content ?? (typeof res === 'string' ? res : "");
  return Array.isArray(content) ? content.map((c: any) => c.text ?? "").join("") : content;
}


