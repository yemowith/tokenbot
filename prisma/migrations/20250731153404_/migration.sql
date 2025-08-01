/*
  Warnings:

  - Added the required column `privateKey` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Wallet" ADD COLUMN     "privateKey" TEXT NOT NULL;
