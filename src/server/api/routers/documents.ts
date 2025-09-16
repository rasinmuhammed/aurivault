import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const documentsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new Error("No tenant");
    const docs = await ctx.db.document.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, title: true, filename: true, uploadedAt: true, size: true },
    });
    return docs;
  }),
});


