"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export function AvailabilityChecker({ itemId }: { itemId: string }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const checkAvailability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/decorations/${itemId}/availability`);
      const data = await res.json();
      if (data.availableDate) {
        setDate(new Date(data.availableDate).toLocaleDateString());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setChecked(true);
  };

  if (checked) {
    return (
      <div className="text-sm border border-amber-200 bg-amber-50 px-2 py-1 rounded-md font-bold text-amber-700 flex items-center">
        <Calendar className="w-3.5 h-3.5 mr-1.5" />
        {date ? `Available on ${date}` : "Currently unavailable"}
      </div>
    );
  }

  return (
    <button
      onClick={checkAvailability}
      disabled={loading}
      className="text-amber-600 text-sm font-bold hover:text-amber-700 transition disabled:opacity-50"
    >
      {loading ? "Checking..." : "Check Availability"}
    </button>
  );
}
