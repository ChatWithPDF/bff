/*
  Warnings:

  - Added the required column `queryInEnglish` to the `query` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responseInEnglish` to the `query` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "query" ADD COLUMN     "queryInEnglish" TEXT NOT NULL,
ADD COLUMN     "responseInEnglish" TEXT NOT NULL;
