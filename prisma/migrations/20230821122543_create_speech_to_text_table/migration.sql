-- CreateTable
CREATE TABLE "speech_to_text" (
    "id" SERIAL NOT NULL,
    "audio" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "spell_corrected_text" TEXT NOT NULL,

    CONSTRAINT "speech_to_text_pkey" PRIMARY KEY ("id")
);
