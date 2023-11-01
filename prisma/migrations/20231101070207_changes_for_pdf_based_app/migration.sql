/*
  Warnings:

  - You are about to drop the column `chunkId` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `heading` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `headingEmbedding` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `summaryEmbedding` on the `document` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `document` table. All the data in the column will be lost.
  - You are about to drop the `employee` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "document_chunkId_key";

-- AlterTable
ALTER TABLE "document" DROP COLUMN "chunkId",
DROP COLUMN "heading",
DROP COLUMN "headingEmbedding",
DROP COLUMN "summary",
DROP COLUMN "summaryEmbedding",
DROP COLUMN "type";

-- DropTable
DROP TABLE "employee";
