/*
  Warnings:

  - A unique constraint covering the columns `[chunkId]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "document" ADD COLUMN     "type" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "document_chunkId_key" ON "document"("chunkId");
