import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const payment = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: body.bookingId } });
      if (!booking) throw new Error("Booking not found");

      const createdPayment = await tx.payment.create({
        data: {
          bookingId: body.bookingId,
          amount: body.amount,
          method: body.method,
          transactionId: body.transactionId,
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });

      const newBalance = Math.max(0, Math.round((booking.balance - body.amount) * 100) / 100);

      await tx.booking.update({
        where: { id: body.bookingId },
        data: {
          balance: newBalance,
          isLocked: true, 
        },
      });

      return createdPayment;
    });

    if (session.email) {
      try {
        const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } });
        const template = emailTemplates.paymentReceipt(payment.bookingId, payment.amount, booking?.balance || 0);
        await sendEmail({ to: session.email, ...template });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
