/*
  Warnings:

  - You are about to drop the column `paidAt` on the `Payment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CancellationStatus" ADD VALUE 'REFUND_FAILED';
ALTER TYPE "CancellationStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "paidAt",
ADD COLUMN     "lastRefundAttempt" TIMESTAMP(3),
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "rawPaymentResponse" JSONB,
ADD COLUMN     "rawWaafiResponse" JSONB,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "refundCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundDate" TIMESTAMP(3),
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundReferenceId" TEXT,
ADD COLUMN     "refundResponseCode" TEXT,
ADD COLUMN     "refundResponseMessage" TEXT,
ADD COLUMN     "refundTransactionId" TEXT,
ADD COLUMN     "responseCode" TEXT,
ADD COLUMN     "responseMessage" TEXT;

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "originalTransactionId" TEXT NOT NULL,
    "refundTransactionId" TEXT,
    "referenceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "originalAmount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL,
    "responseCode" TEXT NOT NULL,
    "responseMessage" TEXT NOT NULL,
    "state" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "customerName" TEXT,
    "customerPhone" TEXT,
    "rawRequest" JSONB,
    "rawResponse" JSONB NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Refund_paymentId_key" ON "Refund"("paymentId");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
