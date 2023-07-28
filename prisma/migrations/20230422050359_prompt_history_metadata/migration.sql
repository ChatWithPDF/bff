/*
  Warnings:

  - Added the required column `metadata` to the `prompt_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "prompt_history" ADD COLUMN     "metadata" JSONB NOT NULL;
