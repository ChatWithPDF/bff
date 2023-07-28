/*
  Warnings:

  - Added the required column `answer` to the `config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `config` table without a default value. This is not possible if the table is not empty.
  - Made the column `workflowId` on table `query` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "query" DROP CONSTRAINT "query_workflowId_fkey";

-- AlterTable
ALTER TABLE "config" ADD COLUMN     "answer" TEXT NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "query" ALTER COLUMN "workflowId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "query" ADD CONSTRAINT "query_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
