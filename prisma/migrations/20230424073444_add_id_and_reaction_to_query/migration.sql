/*
  Warnings:

  - The required column `id` was added to the `query` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "query" ADD COLUMN     "id" UUID,
ADD COLUMN     "reaction" SMALLINT NOT NULL DEFAULT 0;
