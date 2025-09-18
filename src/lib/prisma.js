import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = { prisma: null };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
