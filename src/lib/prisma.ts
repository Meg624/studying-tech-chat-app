// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient のインスタンスをグローバルオブジェクトに保持するための型定義。
 * Next.js（特に開発環境）ではモジュールのホットリロードが発生するため、
 * 何度も新しい PrismaClient が生成されると DB 接続が増えすぎてしまう問題を防ぐ目的です。
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * PrismaClient のシングルトンインスタンスを生成または再利用します。
 * 
 * - すでにグローバルに存在すればそれを再利用
 * - 存在しなければ新たに生成
 * 
 * `log` オプションでは Prisma のログレベルを設定できます。
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'], // 本番では 'query' を省くのが推奨
  });

/**
 * 開発環境でのみ、生成した PrismaClient インスタンスを
 * グローバルオブジェクトにキャッシュしておきます。
 *
 * これにより、Next.js のホットリロード時に新しい接続が増えることを防ぎます。
 */
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
