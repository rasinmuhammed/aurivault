import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { embedText, MINILM_DIMENSIONS } from "~/server/ai/embeddings";

export const ragRouter = createTRPCRouter({
  ask: protectedProcedure
    .input(z.object({ question: z.string().min(3), k: z.number().min(1).max(10).default(5) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenantId) {
        throw new Error("No tenant selected. Create or select an organization.");
      }
      const vectors = await embedText([input.question]);
      const queryVec = vectors[0];
      if (!queryVec) throw new Error("Failed to compute embedding");
      // Build vector as PostgreSQL vector literal
      const vec = `[${queryVec.join(",")}]`;
      const results: Array<{
        id: string;
        text: string;
        distance: number;
        documentId: string;
      }> = await ctx.db.$queryRawUnsafe(
        `
        SELECT c.id, c.text, e."chunkId", c."documentId", (e.vector_vec <=> $1) as distance
        FROM "Embedding" e
        JOIN "Chunk" c ON c.id = e."chunkId"
        JOIN "Document" d ON d.id = c."documentId"
        WHERE d."tenantId" = $2 AND e.vector_vec IS NOT NULL
        ORDER BY e.vector_vec <=> $1
        LIMIT $3
        `,
        vec,
        ctx.tenantId,
        input.k,
      );

      // Simple concatenation as MVP context
      const context = results.map((r) => r.text).join("\n---\n");
      const answer = `MVP answer (no LLM yet). Context:\n${context}`;

      return {
        answer,
        citations: results.map((r) => ({ chunkId: r.id, documentId: r.documentId, distance: r.distance })),
      };
    }),
});


