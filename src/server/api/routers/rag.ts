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
        // Ensure user has an organization
        if (!ctx.auth.orgId) {
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

        // Check if documents have been processed (have embeddings)
        const processedChunkCount = await ctx.db.chunk.count({
          where: {
            document: {
              organizationId: ctx.auth.orgId,
            },
            embeddings: {
              some: {
                vector_vec: {
                  not: null,
                },
              },
            },
          },
        });

        if (processedChunkCount === 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Documents are still being processed. Please wait a few minutes and try again.",
          });
        }

        // Prepare context for RAG chain
        const chatContext: ChatContext = {
          question: input.question,
          organizationId: ctx.auth.orgId,
          userId: ctx.auth.userId,
          chatHistory: input.chatHistory,
        };

        // Get RAG chain instance and execute query
        const ragChain = getRAGChain();
        const result = await ragChain.query(chatContext);

        // Log the interaction for analytics (optional)
        await ctx.db.chatLog.create({
          data: {
            organizationId: ctx.auth.orgId,
            userId: ctx.auth.userId,
            question: input.question,
            answer: result.answer,
            confidence: result.confidence,
            processingTimeMs: result.processingTimeMs,
            sourcesCount: result.sources.length,
          },
        }).catch((error) => {
          // Don't fail the request if logging fails
          console.warn("Failed to log chat interaction:", error);
        });

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

  // Health check endpoint
  healthCheck: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const ragChain = getRAGChain();
        const isHealthy = await ragChain.healthCheck();
        
        return {
          status: isHealthy ? "healthy" : "unhealthy",
          timestamp: new Date(),
          groqModel: process.env.GROQ_MODEL_NAME || "llama-3.1-70b-versatile",
        };
      } catch (error) {
        console.error("Health check failed:", error);
        return {
          status: "unhealthy",
          timestamp: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Get chat analytics for the organization
  getAnalytics: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No organization selected.",
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      try {
        // Get chat statistics
        const stats = await ctx.db.chatLog.groupBy({
          by: ["createdAt"],
          where: {
            organizationId: ctx.auth.orgId,
            createdAt: {
              gte: startDate,
            },
          },
          _count: {
            _all: true,
          },
          _avg: {
            confidence: true,
            processingTimeMs: true,
          },
        });

        // Get most queried topics (simple keyword extraction)
        const recentQuestions = await ctx.db.chatLog.findMany({
          where: {
            organizationId: ctx.auth.orgId,
            createdAt: {
              gte: startDate,
            },
          },
          select: {
            question: true,
            confidence: true,
            sourcesCount: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 100,
        });

        // Calculate totals
        const totalQueries = recentQuestions.length;
        const avgConfidence = recentQuestions.reduce((acc, q) => acc + (q.confidence || 0), 0) / totalQueries || 0;
        const avgSources = recentQuestions.reduce((acc, q) => acc + (q.sourcesCount || 0), 0) / totalQueries || 0;

        return {
          totalQueries,
          avgConfidence: Math.round(avgConfidence),
          avgSources: Math.round(avgSources * 10) / 10,
          dailyStats: stats.map(stat => ({
            date: stat.createdAt,
            queries: stat._count._all,
            avgConfidence: Math.round(stat._avg.confidence || 0),
            avgProcessingTime: Math.round(stat._avg.processingTimeMs || 0),
          })),
        };

      } catch (error) {
        console.error("Analytics query error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve analytics data.",
        });
      }
    }),

  // Get suggested questions based on document content
  getSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.auth.orgId) {
        return { suggestions: [] };
      }

      try {
        // Get some recent document titles to generate contextual suggestions
        const recentDocs = await ctx.db.document.findMany({
          where: { organizationId: ctx.auth.orgId },
          select: { title: true, filename: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        // Generate contextual suggestions based on document types
        const suggestions = [
          "Summarize the main points from our recent documents",
          "What are the key findings in our research?",
          "Show me important metrics and KPIs",
          "What recommendations were made?",
          "Identify any risks or concerns mentioned",
          "What are the next steps or action items?",
        ];

        // If we have specific documents, add more targeted suggestions
        if (recentDocs.length > 0) {
          suggestions.push(
            `What does ${recentDocs[0]?.filename || 'the latest document'} say about...?`,
            "Compare findings across all uploaded documents"
          );
        }

        return {
          suggestions: suggestions.slice(0, 6),
          documentCount: recentDocs.length,
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
});