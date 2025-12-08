import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};


(() => {
  const raw = process.env.DATABASE_URL;
  if (raw) {
    
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
