/*
  Warnings:

  - Added the required column `workflowId` to the `query` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "document_userId_key";

-- AlterTable
ALTER TABLE "query" ADD COLUMN     "workflowId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "prompt" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,
    "languageModel" TEXT,
    "version" INTEGER NOT NULL,
    "contextIndependence" BOOLEAN NOT NULL,
    "modelAgnosticInstructions" TEXT,
    "author" TEXT NOT NULL,
    "testing" BOOLEAN NOT NULL,
    "additional_notes" TEXT NOT NULL,

    CONSTRAINT "prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_history" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "queryInEnglish" TEXT NOT NULL,
    "responseInEnglish" TEXT NOT NULL,
    "timesUsed" INTEGER NOT NULL,
    "embedding" vector (1536),

    CONSTRAINT "prompt_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "prompt_history" ADD CONSTRAINT "prompt_history_id_fkey" FOREIGN KEY ("id") REFERENCES "prompt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
