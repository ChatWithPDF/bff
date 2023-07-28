-- AddForeignKey
ALTER TABLE "query" ADD CONSTRAINT "query_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
