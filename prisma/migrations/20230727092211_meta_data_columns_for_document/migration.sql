-- AlterTable
ALTER TABLE "document" ADD COLUMN     "metaData" JSONB,
ADD COLUMN     "pdfId" UUID,
ADD COLUMN     "pdfName" TEXT;
