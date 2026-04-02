import { paymentService } from "@/server/services/payment-service";
import { auth } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payment = await paymentService.processPayment(body);

    if (session.user.email) {
      try {
        const template = emailTemplates.paymentReceipt(payment.amount, 0); // Logic for balance can be updated
        await sendEmail({ to: session.user.email, ...template });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
