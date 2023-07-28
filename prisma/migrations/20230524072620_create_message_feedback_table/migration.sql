-- CreateTable
CREATE TABLE "messageFeedback" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "id" SERIAL NOT NULL,
    "rating" INTEGER,
    "review" TEXT,
    "queryId" UUID NOT NULL,

    CONSTRAINT "messageFeedback_pkey" PRIMARY KEY ("id")
);
