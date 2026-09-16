import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const defaultDbUrl =
  'postgresql://postgres.ouugmlgfbdvxumxtivkj:Mretyun%402096@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDbUrl;
}

const dbUrl = process.env.DATABASE_URL || defaultDbUrl;

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: dbUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
