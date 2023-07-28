-- CreateTable
CREATE TABLE "OdiaEnglish" (
    "index" SERIAL NOT NULL,
    "odiaWord" TEXT NOT NULL,
    "correctTranslation" TEXT NOT NULL,

    CONSTRAINT "OdiaEnglish_pkey" PRIMARY KEY ("index")
);
