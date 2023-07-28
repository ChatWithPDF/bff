-- CreateTable
CREATE TABLE "query" (
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "userId" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "query_userId_createdAt_key" ON "query"("userId", "createdAt");

-- Not sure why this is needed, but it has to be in the same line.
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE; SELECT create_hypertable('query', 'createdAt', 'userId', 4);