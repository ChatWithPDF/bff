/*
  Warnings:

  - You are about to drop the `messageFeedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "messageFeedback";

-- CreateTable
CREATE TABLE "conversationFeedback" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "rating" INTEGER,
    "review" TEXT,
    "conversationId" UUID NOT NULL,

    CONSTRAINT "conversationFeedback_pkey" PRIMARY KEY ("id")
);
