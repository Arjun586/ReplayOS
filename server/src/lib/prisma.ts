// server/src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const dbUrl = process.env.DATABASE_URL || '';
// Safely check if the URL already has query parameters
const separator = dbUrl.includes('?') ? '&' : '?';

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: `${dbUrl}${separator}connection_limit=10&pgbouncer=true`,
        },
    },
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});