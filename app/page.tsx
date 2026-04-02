import Link from "next/link";
import { ArrowRight, Star, Calendar, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-12 lg:mb-0">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
                Elevate Your <span className="text-indigo-600">Events</span> with Premium Decor
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl">
                The ultimate platform for renting high-end event decorations. From weddings to corporate galas, we provide the style you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/decorations"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 md:px-10 transition-all shadow-lg hover:shadow-indigo-200"
                >
                  Browse Catalog
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-lg font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:px-10 transition-all shadow-sm"
                >
                  Join Us
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl skew-y-3">
                <img
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
                  alt="Elegant Event Decoration"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl hidden sm:block">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="text-yellow-400 w-5 h-5 fill-current" />
                  <Star className="text-yellow-400 w-5 h-5 fill-current" />
                  <Star className="text-yellow-400 w-5 h-5 fill-current" />
                  <Star className="text-yellow-400 w-5 h-5 fill-current" />
                  <Star className="text-yellow-400 w-5 h-5 fill-current" />
                </div>
                <p className="font-bold text-gray-900">1000+ Happy Customers</p>
                <p className="text-sm text-gray-500">Premium quality guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose DecorRent?</h2>
            <p className="text-gray-600">We make event planning seamless and beautiful.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Booking</h3>
              <p className="text-gray-600">Select your date and items in seconds. Fast and hassle-free.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Payments</h3>
              <p className="text-gray-600">Pay your deposit securely with Credit Card or Mobile Money.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Star className="text-indigo-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Curated Collection</h3>
              <p className="text-gray-600">Only the best and most stylish decorations for your event.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
