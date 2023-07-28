/*
  Warnings:

  - The `conversationId` column on the `query` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "query" DROP COLUMN "conversationId",
ADD COLUMN     "conversationId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "query_userId_createdAt_conversationId_key" ON "query"("userId", "createdAt", "conversationId");
