-- AlterTable
ALTER TABLE "faq" ADD COLUMN     "answerInEnglish" TEXT,
ADD COLUMN     "questionInEnglish" TEXT,
ALTER COLUMN "question" DROP NOT NULL,
ALTER COLUMN "answer" DROP NOT NULL;
