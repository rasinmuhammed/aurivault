import { ChatGroq } from "@langchain/groq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Document } from "@langchain/core/documents";
import { Pool } from "pg";

// Types
export interface ChatContext {
  question: string;
  organizationId: string;
  userId: string;
  chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    chunkId: string;
    content: string;
    similarity: number;
    metadata: Record<string, any>;
  }>;
  confidence: number;
  processingTimeMs: number;
}

// Initialize Groq LLM
const initializeGroqLLM = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is required");
  }

  return new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL_NAME || "llama-3.1-70b-versatile",
    temperature: 0.1, // Low temperature for factual responses
    maxTokens: 2048,
    topP: 0.9,
    streaming: false,
  });
};

// Initialize embeddings
const initializeEmbeddings = () => {
  // You can use OpenAI embeddings or switch to a local model
  return new OpenAIEmbeddings({
    model: "text-embedding-ada-002",
    maxConcurrency: 5,
    maxRetries: 2,
  });
};

// Initialize vector store
const initializeVectorStore = async (organizationId: string) => {
  const config = {
    postgresConnectionOptions: {
      connectionString: process.env.DATABASE_URL!,
    },
    tableName: "embeddings",
    columns: {
      idColumnName: "id",
      vectorColumnName: "vector_vec",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    // Filter by organization for multi-tenancy
    filter: { organizationId },
  };

  const embeddings = initializeEmbeddings();
  return await PGVectorStore.initialize(embeddings, config);
};

// Enhanced RAG prompt template
const createRAGPrompt = () => {
  const template = `You are AuriVault's AI assistant, an expert knowledge management system. Your role is to provide accurate, helpful answers based on the organization's documents.

CONTEXT DOCUMENTS:
{context}

CHAT HISTORY:
{chatHistory}

CURRENT QUESTION: {question}

INSTRUCTIONS:
1. Answer based ONLY on the provided context documents
2. If you cannot answer from the context, clearly state "I don't have enough information in the uploaded documents to answer this question."
3. Always cite your sources using the document names
4. Provide specific, actionable information when possible
5. If the question is ambiguous, ask for clarification
6. Maintain a professional, helpful tone
7. Format your response clearly with bullet points or sections when appropriate

RESPONSE FORMAT:
- Start with a direct answer
- Support with evidence from the documents
- End with relevant source citations

ANSWER:`;

  return PromptTemplate.fromTemplate(template);
};

// Format chat history for the prompt
const formatChatHistory = (history: Array<{ role: 'user' | 'assistant'; content: string }>) => {
  if (!history || history.length === 0) return "No previous conversation.";
  
  return history
    .slice(-6) // Keep last 6 messages for context
    .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');
};

// Format documents for context
const formatDocuments = (docs: Document[]) => {
  return docs
    .map((doc, index) => {
      const metadata = doc.metadata;
      return `[Document ${index + 1}: ${metadata.documentTitle || 'Unknown'}]
Content: ${doc.pageContent}
Chunk ID: ${metadata.chunkId}
---`;
    })
    .join('\n');
};

// Calculate confidence score based on retrieval results
const calculateConfidence = (docs: Document[], question: string): number => {
  if (docs.length === 0) return 0;
  
  // Simple heuristic: average similarity score
  const avgSimilarity = docs.reduce((acc, doc) => acc + (doc.metadata.similarity || 0), 0) / docs.length;
  
  // Boost confidence for multiple relevant sources
  const sourceBonus = Math.min(docs.length * 0.1, 0.3);
  
  // Length penalty for very short responses
  const lengthBonus = question.length > 20 ? 0.1 : 0;
  
  return Math.min((avgSimilarity + sourceBonus + lengthBonus) * 100, 95);
};

// Main RAG chain implementation
export class AuriVaultRAGChain {
  private llm: ChatGroq;
  private embeddings: OpenAIEmbeddings;
  private prompt: PromptTemplate;

  constructor() {
    this.llm = initializeGroqLLM();
    this.embeddings = initializeEmbeddings();
    this.prompt = createRAGPrompt();
  }

  async query(context: ChatContext): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // 1. Initialize vector store for the organization
      const vectorStore = await initializeVectorStore(context.organizationId);

      // 2. Perform similarity search
      const relevantDocs = await vectorStore.similaritySearchWithScore(
        context.question,
        6, // Retrieve top 6 most relevant chunks
        { organizationId: context.organizationId }
      );

      // 3. Format documents and chat history
      const docs = relevantDocs.map(([doc, similarity]) => ({
        ...doc,
        metadata: { ...doc.metadata, similarity }
      }));

      const formattedDocs = formatDocuments(docs);
      const formattedHistory = formatChatHistory(context.chatHistory || []);

      // 4. Create the RAG chain
      const ragChain = RunnableSequence.from([
        {
          context: () => formattedDocs,
          chatHistory: () => formattedHistory,
          question: new RunnablePassthrough(),
        },
        this.prompt,
        this.llm,
        new StringOutputParser(),
      ]);

      // 5. Generate response
      const answer = await ragChain.invoke(context.question);

      // 6. Calculate confidence
      const confidence = calculateConfidence(docs, context.question);

      // 7. Format sources for response
      const sources = relevantDocs.map(([doc, similarity], index) => ({
        documentId: doc.metadata.documentId,
        chunkId: doc.metadata.chunkId,
        content: doc.pageContent.slice(0, 200) + (doc.pageContent.length > 200 ? '...' : ''),
        similarity: similarity,
        metadata: {
          documentTitle: doc.metadata.documentTitle,
          chunkIndex: doc.metadata.chunkIndex,
        },
      }));

      const processingTimeMs = Date.now() - startTime;

      return {
        answer,
        sources,
        confidence,
        processingTimeMs,
      };

    } catch (error) {
      console.error("RAG Chain Error:", error);
      
      return {
        answer: "I'm sorry, I encountered an error while processing your question. Please try again or contact support if the issue persists.",
        sources: [],
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.llm.invoke([
        { role: "user", content: "Hello, are you working?" }
      ]);
      return !!testResponse;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
let ragChainInstance: AuriVaultRAGChain | null = null;

export const getRAGChain = (): AuriVaultRAGChain => {
  if (!ragChainInstance) {
    ragChainInstance = new AuriVaultRAGChain();
  }
  return ragChainInstance;
};

// Utility function for streaming responses (future enhancement)
export const createStreamingRAGChain = async (context: ChatContext) => {
  const ragChain = getRAGChain();
  
  // Implementation for streaming would go here
  // This is a placeholder for future streaming functionality
  return ragChain.query(context);
};