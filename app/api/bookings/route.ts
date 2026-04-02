import { bookingService } from "@/server/services/booking-service";
import { auth } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const role = session.user.role;
    
    const bookings = role === "ADMIN" 
      ? await bookingService.getAll() 
      : await bookingService.getByUserId(userId);
      
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const booking = await bookingService.createBooking({
      ...body,
      userId: session.user.id,
      // Convert date strings to Date objects
      eventDate: new Date(body.eventDate),
      endDate: new Date(body.endDate),
    });

    // Send email notification
    if (session.user.email) {
      const template = emailTemplates.bookingConfirmation(
        booking.eventDate.toDateString(),
        booking.totalPrice
      );
      await sendEmail({ to: session.user.email, ...template });
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
