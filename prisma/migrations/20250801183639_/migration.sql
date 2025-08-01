-- AlterTable
ALTER TABLE "public"."Action" ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "details" DROP NOT NULL,
ALTER COLUMN "details" SET DEFAULT '{}';
