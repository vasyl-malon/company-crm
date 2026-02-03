/*
  Warnings:

  - The primary key for the `Invitation` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Invitation_id_seq";
