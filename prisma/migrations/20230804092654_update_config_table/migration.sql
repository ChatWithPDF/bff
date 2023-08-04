/*
  Warnings:

  - You are about to drop the column `answer` on the `config` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `config` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `config` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `config` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `config` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `config` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `config` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `config` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "config" DROP COLUMN "answer",
DROP COLUMN "data",
DROP COLUMN "question",
DROP COLUMN "updatedAt",
DROP COLUMN "version",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "metaData" JSONB,
ADD COLUMN     "value" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "config_key_key" ON "config"("key");
