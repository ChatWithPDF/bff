# BFF for AI-tools Playground

This allows for creation and mangement of flows of the building blocks I/O for AKAI.

### Setting up the server

1. Setup

```sh
# Setup DB and Hasura
docker-compose up -d

# Migrate Database
npx prisma migrate dev
# Due to a certain glitch in the matrix, doing it twice works for dev setup.

# Start dev server
yarn start:dev
```

2. Create Missed Indexes
   Currently some indexes get missed despite being part of prisma and need to be created manually. Go to Hasura => Data => SQL and run the following queries:

```sql
create index on prompt_history using ivfflat (embedding vector_cosine_ops) with (lists = 100);
CREATE INDEX on document using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index on prompt_history using ivfflat (pdf vector_cosine_ops) with (lists = 100);
CREATE INDEX on document using ivfflat (pdf vector_cosine_ops) with (lists = 100);
```
