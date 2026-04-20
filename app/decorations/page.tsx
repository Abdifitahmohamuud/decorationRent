import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AvailabilityChecker } from "./AvailabilityChecker";
import { AddToCartButton } from "@/components/AddToCartButton";

export default async function DecorationsPage() {
  const dbDecorations = await prisma.decoration.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
  
  const decorations = dbDecorations.map(d => {
    let image = null;
    if (d.image) {
      const base64 = Buffer.from(d.image).toString("base64");
      // Basic check for image format, defaulting to jpeg if unsure
      image = `data:image/jpeg;base64,${base64}`;
    }
    return { ...d, image };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Our Decorations</h1>
          <p className="text-gray-600 mt-2">Browse our premium collection for your next event.</p>
        </div>
        <Link
          href="/bookings/new"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5 mr-2" />
          Book Now
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {decorations.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-200"
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
              <img
                src={item.image || "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2070&auto=format&fit=crop"}
                alt={item.name}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-indigo-600 shadow-sm">
                ${item.price}/day
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-4">{item.description}</p>
              <div className="flex justify-between items-center text-sm">
                <span className={`px-2 py-1 rounded-md font-medium ${
                  item.availableQty > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {item.availableQty > 0 ? `${item.availableQty} available` : "Out of stock"}
                </span>
                
                {item.availableQty > 0 ? (
                  <AddToCartButton 
                    item={{
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      availableQty: item.availableQty,
                      image: item.image, // Already a base64 string
                    }} 
                  />
                ) : (
                  <AvailabilityChecker itemId={item.id} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {decorations.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">No decorations found. Check back later!</p>
        </div>
      )}
    </div>
  );
}
