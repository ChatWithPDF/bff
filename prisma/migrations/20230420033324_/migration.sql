/*
  Warnings:

  - You are about to drop the column `context` on the `document` table. All the data in the column will be lost.
  - Added the required column `content` to the `document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tags` to the `document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document" DROP COLUMN "context",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT NOT NULL;
