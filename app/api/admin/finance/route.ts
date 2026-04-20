import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export async function GET() {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Cash on Hand (Sum of SUCCESS payments)
    const successfulPayments = await prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
    });
    const cashOnHand = successfulPayments._sum.amount || 0;

    // 2. Outstanding Balance (Sum of pending balances in non-cancelled/completed bookings)
    const outstandingBalances = await prisma.booking.aggregate({
      where: {
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] },
        balance: { gt: 0 }
      },
      _sum: { balance: true }
    });
    const outstandingMoney = outstandingBalances._sum.balance || 0;

    // 3. Expected Total Revenue (completed + pending active bookings)
    const expectedRevenueData = await prisma.booking.aggregate({
      where: {
        status: { notIn: [BookingStatus.CANCELLED] },
      },
      _sum: { totalPrice: true }
    });
    const expectedRevenue = expectedRevenueData._sum.totalPrice || 0;

    // 4. Breakdown by payment method
    const paymentBreakdownQuery = await prisma.payment.groupBy({
      by: ['method'],
      where: { status: PaymentStatus.SUCCESS },
      _sum: { amount: true },
      _count: true
    });

    const paymentBreakdown = [];
    for (let i = 0; i < paymentBreakdownQuery.length; i++) {
      const pb = paymentBreakdownQuery[i];
      paymentBreakdown.push({
        method: pb.method,
        totalAmount: pb._sum.amount || 0,
        count: pb._count
      });
    }

    // 5. Recent Transactions
    const recentTransactions = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: { user: { select: { fullName: true } } }
        }
      }
    });

    return NextResponse.json({
      cashOnHand,
      outstandingMoney,
      expectedRevenue,
      paymentBreakdown,
      recentTransactions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
