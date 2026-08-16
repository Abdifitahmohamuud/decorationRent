"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingDown, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";

interface FinanceStats {
  cashOnHand: number;
  outstandingMoney: number;
  expectedRevenue: number;
}

export default function AdminFinanceDashboard() {
  const [data, setData] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/finance")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load finance data");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400 font-medium text-sm">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          Loading ledger...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center text-red-500 font-medium">
        Couldn't load finance data. Try refreshing.
      </div>
    );
  }

  const collectionRate =
    data.expectedRevenue > 0
      ? Math.min(100, (data.cashOnHand / data.expectedRevenue) * 100)
      : 0;
  const remaining = Math.max(0, data.expectedRevenue - data.cashOnHand);

  const today = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="p-8 lg:p-12 space-y-10 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-[0.2em] mb-2">
            Finance
          </p>
          <h1 className="text-4xl font-serif font-medium text-gray-900 tracking-tight">
            Ledger Overview
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
          <Calendar className="w-4 h-4" />
          <span>As of {today}</span>
        </div>
      </header>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="Cash on Hand"
          caption="Received and settled"
          value={data.cashOnHand}
          icon={<DollarSign className="w-5 h-5" />}
          tone="emerald"
        />
        <MetricCard
          label="Outstanding"
          caption="Owed by active bookings"
          value={data.outstandingMoney}
          icon={<TrendingDown className="w-5 h-5" />}
          tone="amber"
        />
        <MetricCard
          label="Expected Revenue"
          caption="Total of active bookings"
          value={data.expectedRevenue}
          icon={<CheckCircle2 className="w-5 h-5" />}
          tone="indigo"
        />
      </div>

      {/* Collection rate — signature element tying the three numbers together */}
      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-serif font-medium text-gray-900">
              Collection Rate
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Share of expected revenue already collected
            </p>
          </div>
          <div className="text-right leading-none">
            <span className="text-5xl font-serif font-medium text-gray-900">
              {collectionRate.toFixed(0)}
            </span>
            <span className="text-xl font-serif text-gray-400">%</span>
          </div>
        </div>

        <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${collectionRate}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-gray-600 font-medium">
              ${data.cashOnHand.toLocaleString()} collected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span className="text-gray-400 font-medium">
              ${remaining.toLocaleString()} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  caption,
  value,
  icon,
  tone,
}: {
  label: string;
  caption: string;
  value: number;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "indigo";
}) {
  const tones = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", bar: "bg-indigo-500" },
  }[tone];

  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-1 w-full ${tones.bar}`} />
      <div className="flex items-center justify-between mb-6">
        <div className={`p-2.5 rounded-xl ${tones.bg} ${tones.text}`}>{icon}</div>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <h3 className="text-4xl font-serif font-medium text-gray-900">
        ${value.toLocaleString()}
      </h3>
      <p className="text-sm text-gray-400 mt-2">{caption}</p>
    </div>
  );
}