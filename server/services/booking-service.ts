import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export const bookingService = {
  async checkAvailability(decorationId: string, startDate: Date, endDate: Date, requestedQty: number) {
    const decoration = await prisma.decoration.findUnique({ where: { id: decorationId } });
    if (!decoration) throw new Error("Decoration not found");

    // Find all bookings that overlap with the requested dates and are not cancelled
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        OR: [
          {
            eventDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
        bookingItems: {
          some: { decorationId },
        },
      },
      include: {
        bookingItems: {
          where: { decorationId },
        },
      },
    });

    const reservedQty = overlappingBookings.reduce((sum, booking) => {
      const item = booking.bookingItems.find((i) => i.decorationId === decorationId);
      return sum + (item?.quantity || 0);
    }, 0);

    return decoration.totalQty - reservedQty >= requestedQty;
  },

  async createBooking(data: {
    userId: string;
    eventDate: Date;
    endDate: Date;
    location: string;
    items: { decorationId: string; quantity: number }[];
  }) {
    return await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const bookingItemsData = [];

      for (const item of data.items) {
        const decoration = await tx.decoration.findUnique({ where: { id: item.decorationId } });
        if (!decoration) throw new Error(`Decoration ${item.decorationId} not found`);

        const isAvailable = await this.checkAvailability(item.decorationId, data.eventDate, data.endDate, item.quantity);
        if (!isAvailable) throw new Error(`Decoration ${decoration.name} is not available for these dates`);

        totalPrice += decoration.price * item.quantity;
        bookingItemsData.push({
          decorationId: item.decorationId,
          quantity: item.quantity,
          price: decoration.price,
        });
      }

      const deposit = totalPrice * 0.2;
      const balance = totalPrice - deposit;

      const booking = await tx.booking.create({
        data: {
          userId: data.userId,
          eventDate: data.eventDate,
          endDate: data.endDate,
          location: data.location,
          totalPrice,
          deposit,
          balance,
          status: BookingStatus.PENDING,
          bookingItems: {
            create: bookingItemsData,
          },
        },
        include: {
          bookingItems: true,
        },
      });

      // Following user instruction: "Reduce availableQty after booking"
      // NOTE: In a real app, we'd probably only do this for "current" inventory or handle it more dynamically.
      for (const item of data.items) {
        await tx.decoration.update({
          where: { id: item.decorationId },
          data: { availableQty: { decrement: item.quantity } },
        });
      }

      return booking;
    });
  },

  async cancelBooking(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { bookingItems: true },
      });

      if (!booking || booking.status === BookingStatus.CANCELLED) return booking;

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Restore quantity
      for (const item of booking.bookingItems) {
        await tx.decoration.update({
          where: { id: item.decorationId },
          data: { availableQty: { increment: item.quantity } },
        });
      }

      return updatedBooking;
    });
  },

  async getByUserId(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      include: { bookingItems: { include: { decoration: true } } },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAll() {
    return prisma.booking.findMany({
      include: { user: true, bookingItems: { include: { decoration: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
};
