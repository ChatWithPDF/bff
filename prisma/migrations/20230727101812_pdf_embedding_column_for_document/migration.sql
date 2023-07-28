-- AlterTable
ALTER TABLE "document" ADD COLUMN     "embeddingType" TEXT,
ADD COLUMN     "pdf" vector(768);
-- AlterTable
ALTER TABLE "prompt_history" ADD COLUMN     "embeddingType" TEXT,
ADD COLUMN     "pdf" vector(768);