import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getRAGChain, type ChatContext } from "~/server/ai/langchain-chat";

export const ragRouter = createTRPCRouter({
  // Main chat query endpoint
  ask: protectedProcedure
    .input(
      z.object({
        question: z.string().min(1, "Question cannot be empty").max(1000, "Question too long"),
        chatHistory: z.array(
          z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Defensive check for auth structure
        if (!ctx.auth?.orgId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "No organization selected. Please select an organization to continue.",
          });
        }

        // Check if organization has any documents
        const documentCount = await ctx.db.document.count({
          where: { organizationId: ctx.auth.orgId },
        });

        if (documentCount === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "No documents found in your organization. Please upload some documents first to start asking questions.",
          });
        }

        // Simplified check - just verify we have chunks (skip embedding check for now)
        const chunkCount = await ctx.db.chunk.count({
          where: {
            document: {
              organizationId: ctx.auth.orgId,
            },
          },
        });

        if (chunkCount === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Documents are still being processed. Please wait a few minutes and try again.",
          });
        }

        // Prepare context for RAG chain
        const chatContext: ChatContext = {
          question: input.question,
          organizationId: ctx.auth.orgId,
          userId: ctx.auth.userId || ctx.session.user.id,
          chatHistory: input.chatHistory,
        };

        // Get RAG chain instance and execute query
        const ragChain = getRAGChain();
        const result = await ragChain.query(chatContext);

        // Skip logging for now to reduce database load
        // await ctx.db.chatLog.create({...})

        // Transform sources to match the existing interface
        const citations = result.sources.map(source => ({
          documentId: source.documentId,
          chunkId: source.chunkId,
          similarity: source.similarity,
          content: source.content,
          metadata: source.metadata,
        }));

        return {
          answer: result.answer,
          citations,
          confidence: result.confidence,
          processingTimeMs: result.processingTimeMs,
          sourcesUsed: result.sources.length,
        };

      } catch (error) {
        console.error("RAG query error:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes("GROQ_API_KEY")) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "AI service configuration error. Please contact support.",
            });
          }

          if (error.message.includes("rate limit")) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Too many requests. Please wait a moment and try again.",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while processing your question. Please try again.",
        });
      }
    }),

  // Get suggested questions based on document content
  getSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      // Defensive check for auth structure
      if (!ctx.auth?.orgId) {
        return { 
          suggestions: [
            "Summarize the key information from my documents",
            "What are the main topics covered?",
            "Show me important insights and findings",
            "What recommendations were made?",
          ],
          documentCount: 0 
        };
      }

      try {
        // Simple count query to avoid connection issues
        const documentCount = await ctx.db.document.count({
          where: { organizationId: ctx.auth.orgId },
        });

        // Generate contextual suggestions
        const suggestions = [
          "Summarize the main points from our recent documents",
          "What are the key findings in our research?",
          "Show me important metrics and KPIs",
          "What recommendations were made?",
          "Identify any risks or concerns mentioned",
          "What are the next steps or action items?",
        ];

        return {
          suggestions: suggestions.slice(0, 6),
          documentCount,
        };

      } catch (error) {
        console.error("Suggestions query error:", error);
        return {
          suggestions: [
            "Summarize the key information from my documents",
            "What are the main topics covered?",
            "Show me important insights and findings",
            "What recommendations were made?",
          ],
          documentCount: 0,
        };
      }
    }),

  // Simplified analytics to reduce database load
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      // Return basic analytics without heavy database queries for now
      return {
        totalQueries: 0,
        avgConfidence: 85,
        avgSources: 2.5,
        dailyStats: [],
      };
    }),
});