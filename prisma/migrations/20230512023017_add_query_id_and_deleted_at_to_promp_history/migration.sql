-- AlterTable
ALTER TABLE "prompt_history" ADD COLUMN     "deletedAt" TIMESTAMPTZ(3),
ADD COLUMN     "queryId" UUID;
