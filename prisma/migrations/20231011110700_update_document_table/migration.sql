/*
  Warnings:

  - You are about to drop the column `embedding` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `embeddingType` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `pdf` on the `document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document" DROP COLUMN "embedding",
DROP COLUMN "embeddingType",
DROP COLUMN "pdf",
ADD COLUMN     "contentEmbedding" vector(768),
ADD COLUMN     "heading" TEXT,
ADD COLUMN     "headingEmbedding" vector(768),
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "summaryEmbedding" vector(768);