import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  var cachedPrisma: PrismaClient | undefined;
}

// Prisma Client configuration with connection pooling and lifecycle management
const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL || "";
  const isRemote =
    connectionString.length > 0 &&
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1");

  let poolConfig: any;
  try {
    const dbUrl = new URL(connectionString);
    poolConfig = {
      user: dbUrl.username ? decodeURIComponent(dbUrl.username) : undefined,
      password: dbUrl.password ? decodeURIComponent(dbUrl.password) : undefined,
      host: dbUrl.hostname,
      port: dbUrl.port ? parseInt(dbUrl.port, 10) : 5432,
      database: dbUrl.pathname ? dbUrl.pathname.replace(/^\//, "") : "postgres",
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    poolConfig = {
      connectionString,
      ssl: isRemote ? { rejectUnauthorized: false } : undefined,
    };
  }

  const pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    const cleanup = async () => {
      await client.$disconnect();
    };

    process.on("beforeExit", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }

  return client;
};

const getPrisma = () => {
  if (process.env.NODE_ENV === "production") {
    return prismaClientSingleton();
  }
  if (!global.cachedPrisma) {
    global.cachedPrisma = prismaClientSingleton();
  }
  return global.cachedPrisma;
};

export const prismadb = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrisma();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
