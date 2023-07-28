/*
  Warnings:

  - A unique constraint covering the columns `[conversationId]` on the table `conversationFeedback` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "conversationFeedback_conversationId_key" ON "conversationFeedback"("conversationId");
