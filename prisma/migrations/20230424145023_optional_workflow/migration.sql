-- DropForeignKey
ALTER TABLE "query" DROP CONSTRAINT "query_workflowId_fkey";

-- AlterTable
ALTER TABLE "query" ALTER COLUMN "workflowId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "query" ADD CONSTRAINT "query_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
