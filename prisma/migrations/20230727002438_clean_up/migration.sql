/*
  Warnings:

  - You are about to drop the column `workflowId` on the `query` table. All the data in the column will be lost.
  - You are about to drop the `OdiaEnglish` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversationFeedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faq` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feedback` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `prompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workflow` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "query" DROP CONSTRAINT "query_workflowId_fkey";

-- AlterTable
ALTER TABLE "query" DROP COLUMN "workflowId";

-- DropTable
DROP TABLE "OdiaEnglish";

-- DropTable
DROP TABLE "conversationFeedback";

-- DropTable
DROP TABLE "faq";

-- DropTable
DROP TABLE "feedback";

-- DropTable
DROP TABLE "prompt";

-- DropTable
DROP TABLE "workflow";
