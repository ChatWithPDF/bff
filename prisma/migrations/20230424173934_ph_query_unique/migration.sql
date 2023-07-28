/*
  Warnings:

  - A unique constraint covering the columns `[queryInEnglish]` on the table `prompt_history` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "prompt_history_queryInEnglish_key" ON "prompt_history"("queryInEnglish");
