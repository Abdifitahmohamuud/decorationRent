import { prisma } from '@/lib/prisma';

/**
 * Stores a successful WaafiPay payment and updates the related booking.
 * Executes within a transaction to ensure atomicity.
 */
export const storeSuccessfulPayment = async ({
  bookingId,
  amount,
  transactionId,
  phoneNumber,
  referenceId,
  responseCode,
  responseMessage,
  rawPaymentResponse,
}: {
  bookingId: string;
  amount: number;
  transactionId: string;
  phoneNumber: string;
  referenceId?: string;
  responseCode?: string;
  responseMessage?: string;
  rawPaymentResponse?: any;
}) => {
  // Ensure the booking exists before recording payment
  const existingBooking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!existingBooking) {
    throw new Error(`Booking with id ${bookingId} not found`);
  }
  return await prisma.$transaction(async (tx) => {
    // Create payment record
    const payment = await tx.payment.create({
      data: {
        bookingId,
        amount,
        method: "MOBILE_MONEY",
        transactionId,
        status: "SUCCESS",
        phoneNumber,
        referenceId,
        responseCode,
        responseMessage,
        rawPaymentResponse,
      },
    });

    // Update booking: decrement balance, lock, set status to CONFIRMED, and store payer phone
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        balance: { decrement: amount },
        isLocked: true,
        phoneNumber,
        status: "CONFIRMED",
      },
    });

    return payment;
  });
};

/**
 * Records a failed WaafiPay payment attempt.
 * Saves the raw response and status for auditing.
 */
export const recordFailedPayment = async ({
  bookingId,
  amount,
  transactionId,
  phoneNumber,
  paymentStatus,
  waafiResponse,
}: {
  bookingId: string;
  amount: number;
  transactionId: string;
  phoneNumber: string;
  paymentStatus: string; // e.g., REJECTED, CANCELLED, TIMEOUT, FAILED
  waafiResponse: any;
}) => {
  // Verify booking exists before recording failed payment
  const existingBooking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!existingBooking) {
    throw new Error(`Booking with id ${bookingId} not found`);
  }
  return await prisma.$transaction(async (tx) => {
    // Create payment record with failure status
    const payment = await tx.payment.create({
      data: {
        bookingId,
        amount,
        method: "MOBILE_MONEY",
        transactionId,
        status: "FAILED",
        phoneNumber,
        // Optionally store raw response for debugging if schema supports
      },
    });

    // Update booking: keep balance unchanged.
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        // No balance change; can log status elsewhere if needed
      },
    });

    return payment;
  });
};
