/*
  Warnings:

  - The `tags` column on the `document` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[id]` on the table `document` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "document" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "tags",
ADD COLUMN     "tags" TEXT[];
DROP SEQUENCE "document_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "document_id_key" ON "document"("id");
