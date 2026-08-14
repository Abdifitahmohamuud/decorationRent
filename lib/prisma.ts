import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 10 second timeout for new connections
});

// Handle pool errors
pool.on("error", (err) => {
    console.error("[PRISMA_POOL] Unexpected error on idle client", err);
});

pool.on("connect", () => {
    console.log("[PRISMA_POOL] New client connected");
});

const adapter = new PrismaPg(pool as any);

const prismaClientSingleton = () => {
    const client = new PrismaClient({ 
        adapter,
        log: process.env.NODE_ENV !== "production" ? ["error", "warn"] : ["error"],
    });

    // Handle client errors
    client.$on("error", (error) => {
        console.error("[PRISMA_CLIENT] Error event:", error);
    });

    return client;
};

declare const globalThis: {
    prismaGlobalV2?: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const _prisma = globalThis.prismaGlobalV2 ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobalV2 = _prisma;
}

export const db = _prisma;
export const prisma = _prisma;
export default _prisma;