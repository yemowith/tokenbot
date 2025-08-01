-- CreateTable
CREATE TABLE "public"."WalletTag" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WalletTag" ADD CONSTRAINT "WalletTag_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
