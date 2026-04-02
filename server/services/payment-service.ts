import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, PaymentMethod } from "@prisma/client";

export const paymentService = {
  async processPayment(data: {
    bookingId: string;
    amount: number;
    method: PaymentMethod;
    transactionId: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: data.bookingId } });
      if (!booking) throw new Error("Booking not found");

      const payment = await tx.payment.create({
        data: {
          bookingId: data.bookingId,
          amount: data.amount,
          method: data.method,
          transactionId: data.transactionId,
          status: PaymentStatus.SUCCESS,
          paidAt: new Date(),
        },
      });

      // Update booking balance and status
      const newBalance = booking.balance - data.amount;
      const newStatus = newBalance <= 0 ? BookingStatus.CONFIRMED : booking.status;

      await tx.booking.update({
        where: { id: data.bookingId },
        data: {
          balance: newBalance,
          status: newStatus,
          isLocked: true, // Lock booking after payment
        },
      });

      return payment;
    });
  },

  async getByBookingId(bookingId: string) {
    return prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getReports() {
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    });

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      bookingsByStatus,
    };
  },
};
