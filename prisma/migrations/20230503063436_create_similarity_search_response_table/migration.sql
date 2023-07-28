-- CreateTable
CREATE TABLE "similarity_search_response" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "queryId" UUID NOT NULL,

    CONSTRAINT "similarity_search_response_pkey" PRIMARY KEY ("id")
);
