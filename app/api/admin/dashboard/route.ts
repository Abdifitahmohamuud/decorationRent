import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalUsers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalBookings = await prisma.booking.count();
    const activeRentals = await prisma.booking.count({ where: { status: "CONFIRMED" } });
    
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    });

    // Calculate analytics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueByDay = await prisma.payment.findMany({
      where: { 
        status: "SUCCESS",
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" }
    });

    // Grouping manually to handle date formatting
    const dailyData: Record<string, number> = {};
    revenueByDay.forEach(p => {
      const date = p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyData[date] = (dailyData[date] || 0) + p.amount;
    });

    const chartData = Object.entries(dailyData).map(([date, amount]) => ({ date, amount }));

    // Recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });


    return NextResponse.json({
      stats: {
        totalUsers,
        totalBookings,
        activeRentals,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      recentBookings,
      chartData
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

