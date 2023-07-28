-- AlterTable
ALTER TABLE "query" ADD COLUMN     "workflowId" INTEGER;

-- CreateTable
CREATE TABLE "workflow" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "workflow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "query" ADD CONSTRAINT "query_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
