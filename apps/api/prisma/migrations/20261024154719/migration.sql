/*
  Warnings:

  - Made the column `storeId` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "storeId" SET NOT NULL,
ALTER COLUMN "subtotal" DROP DEFAULT;
