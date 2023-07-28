/*
  Warnings:

  - A unique constraint covering the columns `[userId,createdAt,conversationId]` on the table `query` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "query" ADD COLUMN     "conversationId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "query_userId_createdAt_conversationId_key" ON "query"("userId", "createdAt", "conversationId");
