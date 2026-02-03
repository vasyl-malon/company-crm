/*
  Warnings:

  - The primary key for the `EmailVerification` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "EmailVerification" DROP CONSTRAINT "EmailVerification_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "EmailVerification_id_seq";

-- CreateIndex
CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");
