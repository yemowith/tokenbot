/*
  Warnings:

  - Added the required column `amount` to the `Action` table without a default value. This is not possible if the table is not empty.
  - Added the required column `details` to the `Action` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Action" ADD COLUMN     "amount" TEXT NOT NULL,
ADD COLUMN     "details" JSONB NOT NULL;
