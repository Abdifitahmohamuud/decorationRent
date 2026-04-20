import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { any } from "zod";

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
   

});
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter });
}

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