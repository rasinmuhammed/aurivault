import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const documentsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.tenantId) throw new Error("No tenant");
    const docs = await ctx.db.document.findMany({
      where: { organizationId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, filename: true, createdAt: true, size: true },
    });
    return docs;
  }),
});


