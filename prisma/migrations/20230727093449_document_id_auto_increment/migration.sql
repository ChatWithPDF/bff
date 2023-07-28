-- DropIndex
DROP INDEX "document_id_key";

-- AlterTable
CREATE SEQUENCE document_id_seq;
ALTER TABLE "document" ALTER COLUMN "id" SET DEFAULT nextval('document_id_seq');
ALTER SEQUENCE document_id_seq OWNED BY "document"."id";
