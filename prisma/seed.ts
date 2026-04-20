import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  // Create Admin
  await prisma.user.upsert({
    where: { email: "admin@decorrent.com" },
    update: {},
    create: {
      fullName: "Admin User",
      email: "admin@decorrent.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create Customer
  await prisma.user.upsert({
    where: { email: "john@example.com" },
    update: {},
    create: {
      fullName: "John Doe",
      email: "john@example.com",
      password: userPassword,
      role: "CUSTOMER",
    },
  });

  // Create Decorations
  const decorations = [
    {
      name: "Luxury White Backdrop",
      description: "Elegant 3x3m white silk backdrop for weddings and gala events.",
      price: 150.0,
      totalQty: 5,
      availableQty: 5,
      image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop",
    },
    {
      name: "Gold Chiavari Chairs",
      description: "Premium gold-finished wooden chairs with white cushions.",
      price: 5.0,
      totalQty: 200,
      availableQty: 200,
      image: "https://images.unsplash.com/photo-1517705008128-361805f42e8a?q=80&w=2070&auto=format&fit=crop",
    },
    {
      name: "Crystal Chandelier Centerpiece",
      description: "Stunning crystal chandelier for table centerpieces.",
      price: 25.0,
      totalQty: 20,
      availableQty: 20,
      image: "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2070&auto=format&fit=crop",
    },
    {
      name: "Ambient Up-lighting Set",
      description: "Set of 8 wireless LED up-lights for wall washing.",
      price: 80.0,
      totalQty: 10,
      availableQty: 10,
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  
   
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
