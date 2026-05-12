/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `agents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "bio" DROP NOT NULL,
ALTER COLUMN "experienceYears" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");
