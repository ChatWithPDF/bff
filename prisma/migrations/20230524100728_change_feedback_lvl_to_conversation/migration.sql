/*
  Warnings:

  - You are about to drop the column `queryId` on the `messageFeedback` table. All the data in the column will be lost.
  - Added the required column `conversationId` to the `messageFeedback` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "messageFeedback" DROP COLUMN "queryId",
ADD COLUMN     "conversationId" UUID NOT NULL;
