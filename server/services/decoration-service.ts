import { prisma } from "@/lib/prisma";

export const decorationService = {
  async getAll() {
    const decorations = await prisma.decoration.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return decorations.map(d => ({
      ...d,
      image: d.image ? `data:image/jpeg;base64,${Buffer.from(d.image).toString("base64")}` : null
    }));
  },

  async getById(id: string) {
    const d = await prisma.decoration.findUnique({
      where: { id },
    });
    if (!d) return null;
    return {
      ...d,
      image: d.image ? `data:image/jpeg;base64,${Buffer.from(d.image).toString("base64")}` : null
    };
  },

  async create(data: {
    name: string;
    description: string;
    category?: string;
    image?: string;
    price: number;
    totalQty: number;
  }) {
    const { image, category, ...rest } = data;
    let imageBuffer = null;
    if (image) {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      imageBuffer = Buffer.from(base64Data, "base64");
    }

    return prisma.decoration.create({
      data: {
        ...rest,
        // category: category || "General",
        image: imageBuffer,
        availableQty: rest.totalQty,
      },
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    image: string | Buffer;
    price: number;
    totalQty: number;
    isActive: boolean;
  }>) {
    const { image, category, ...rest } = data;
    let updateData: any = { ...rest };
    // if (category) updateData.category = category;
    
    if (image && typeof image === "string") {
      const base64Data = image.includes("base64,") ? image.split("base64,")[1] : image;
      updateData.image = Buffer.from(base64Data, "base64");
    }

    return prisma.decoration.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return prisma.decoration.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
