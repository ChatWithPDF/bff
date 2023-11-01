/*
  Warnings:

  - You are about to drop the column `queryInEnglish` on the `query` table. All the data in the column will be lost.
  - You are about to drop the column `responseInEnglish` on the `query` table. All the data in the column will be lost.
  - You are about to drop the `prompt_history` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "query" DROP COLUMN "queryInEnglish",
DROP COLUMN "responseInEnglish";

-- DropTable
DROP TABLE "prompt_history";
