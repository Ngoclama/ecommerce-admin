import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Sanitize DATABASE_URL to avoid hidden newlines/whitespace causing Prisma validation errors
(() => {
  const raw = process.env.DATABASE_URL;
  if (raw) {
    // Remove any whitespace/newlines that may have been introduced accidentally
    const sanitized = raw.trim().replace(/\s+/g, "");
    if (sanitized !== raw) {
      process.env.DATABASE_URL = sanitized;
    }
  }
})();

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
