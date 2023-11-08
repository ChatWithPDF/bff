/*
  Warnings:

  - You are about to drop the column `pdfId` on the `prompt_history` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[queryInEnglish]` on the table `prompt_history` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "prompt_history_queryInEnglish_pdfId_key";

-- AlterTable
ALTER TABLE "prompt_history" DROP COLUMN "pdfId";

-- CreateIndex
CREATE UNIQUE INDEX "prompt_history_queryInEnglish_key" ON "prompt_history"("queryInEnglish");
