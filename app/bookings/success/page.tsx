import Link from "next/link";
import { CheckCircle, Calendar, ArrowRight } from "lucide-react";

export default function BookingSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="bg-white rounded-4xl p-12 shadow-xl border border-indigo-50">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-green-200">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Booking Successful!</h1>
        <p className="text-lg text-gray-600 mb-12 max-w-md mx-auto leading-relaxed">
          Your deposit has been received and your booking is now <span className="text-green-600 font-bold uppercase tracking-wider text-sm bg-green-50 px-2 py-0.5 rounded border border-green-100">Confirmed</span>. We've sent a confirmation email with all the details.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/bookings"
            className="flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <Calendar className="w-5 h-5 mr-2" />
            View My Bookings
          </Link>
          <Link
            href="/decorations"
            className="flex items-center justify-center px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition"
          >
            Back to Catalog
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
      
      <p className="mt-12 text-gray-500 text-sm italic">
        Need to make changes? Contact our support team at support@decorrent.com
      </p>
    </div>
  );
}
