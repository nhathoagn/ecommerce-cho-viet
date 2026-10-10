ALTER TABLE "Order" ADD COLUMN "storeId" TEXT,
ADD COLUMN "subtotal" DECIMAL(14,0) NOT NULL DEFAULT 0,
ADD COLUMN "discountAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
ADD COLUMN "shippingAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
ADD COLUMN "shippingAddress" JSONB,
ADD COLUMN "couponCode" TEXT;
UPDATE "Order" SET "shippingAddress" = '{}'::jsonb WHERE "shippingAddress" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "shippingAddress" SET NOT NULL;

CREATE TABLE "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "percentOff" INTEGER,
  "fixedAmountOff" DECIMAL(14,0),
  "minOrderAmount" DECIMAL(14,0) NOT NULL DEFAULT 0,
  "maxUses" INTEGER,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Order_buyerId_createdAt_idx" ON "Order"("buyerId", "createdAt");
CREATE INDEX "Order_storeId_status_idx" ON "Order"("storeId", "status");
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
