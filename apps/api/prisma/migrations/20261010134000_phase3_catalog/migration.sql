-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');
CREATE TYPE "InventoryTransactionType" AS ENUM ('INITIAL', 'ADJUSTMENT', 'SALE', 'RESTOCK', 'RETURN');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "imageKey",
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "compareAtPrice" DECIMAL(14,0),
ADD COLUMN "sku" TEXT,
ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';
UPDATE "Product" SET "sku" = 'LEGACY-' || "id" WHERE "sku" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

ALTER TABLE "Store" ADD COLUMN "bannerKey" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "logoKey" TEXT,
ADD COLUMN "status" "StoreStatus" NOT NULL DEFAULT 'ACTIVE';

CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageKey" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "before" INTEGER NOT NULL,
    "after" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "ProductImage_productId_objectKey_key" ON "ProductImage"("productId", "objectKey");
CREATE INDEX "InventoryTransaction_productId_createdAt_idx" ON "InventoryTransaction"("productId", "createdAt");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_storeId_status_idx" ON "Product"("storeId", "status");
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
