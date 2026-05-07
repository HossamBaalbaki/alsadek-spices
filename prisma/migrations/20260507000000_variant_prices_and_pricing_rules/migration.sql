-- Remove sellPricePerGram from stocks (prices now live on product variants)
ALTER TABLE "stocks" DROP COLUMN IF EXISTS "sellPricePerGram";

-- Create pricing_rules table for margin learning
CREATE TABLE "pricing_rules" (
    "id" SERIAL NOT NULL,
    "stockId" INTEGER NOT NULL,
    "markupPercent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pricing_rules_stockId_key" ON "pricing_rules"("stockId");
