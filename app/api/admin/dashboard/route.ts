import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalUsers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalBookings = await prisma.booking.count();
    const activeRentals = await prisma.booking.count({
      where: {
        status: { in: ["TAKEN", "CONFIRMED"] }
      }
    });
    
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
    // Grouping manually to handle date formatting
    const dailyData: Record<string, number> = {};
    for (let i = 0; i < revenueByDay.length; i++) {
      const p = revenueByDay[i];
      const date = p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyData[date] = (dailyData[date] || 0) + p.amount;
    }

    const chartData = [];
    const dates = Object.keys(dailyData);
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      chartData.push({
        date: date,
        amount: dailyData[date]
      });
    }

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

