/*
  Warnings:

  - You are about to drop the column `queryInEnglish` on the `query` table. All the data in the column will be lost.
  - You are about to drop the column `responseInEnglish` on the `query` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "query" DROP COLUMN "queryInEnglish",
DROP COLUMN "responseInEnglish";
