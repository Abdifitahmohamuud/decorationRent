"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Plus,
  Minus,
  Trash2,
  Calendar,
  MapPin,
  User,
  Package,
  Search,
  Phone,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const LOCATIONS = [
  "Hodan",
  "Wadajir",
  "Dharkiinleey",
  "Wabari",
  "Xamar Wayne",
  "Boondheer",
  "Kaaraan",
  "Kaxda",
  "Dayniile",
  "Garasbaaleey",
  "Cabdicasiis",
  "Gubadleey",
  "Shibi",
  "Yaaqshiid",
  "Hawlwadaag",
];

type PaymentMethod =
  | "LOCAL_EVC"
  | "LOCAL_EDAHAB"
  | "LOCAL_SAHAL"
  | "LOCAL_PREMIER_WALLET"
  | "GLOBAL_MASTERCARD"
  | "GLOBAL_PAYPAL";

/* ------------------------------------------------------------------ */
/*  Reusable searchable dropdown (used for both user & product pick)  */
/* ------------------------------------------------------------------ */

function SearchableSelect({
  label,
  icon,
  placeholder,
  displayValue,
  options,
  getLabel,
  getSubLabel,
  onSelect,
  required,
  disabled,
}: {
  label?: string;
  icon?: React.ReactNode;
  placeholder: string;
  displayValue: string;
  options: any[];
  getLabel: (o: any) => string;
  getSubLabel?: (o: any) => string;
  onSelect: (o: any) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    getLabel(o).toLowerCase().includes(query.toLowerCase()) ||
    (getSubLabel ? getSubLabel(o).toLowerCase().includes(query.toLowerCase()) : false)
  );

  return (
    <div className="space-y-2 relative" ref={ref}>
      {label && (
        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1 flex items-center">
          {icon}
          {label}
        </label>
      )}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          disabled={disabled}
          required={required && !displayValue}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 disabled:opacity-50"
          value={open ? query : displayValue}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
        />
        {open && (
          <div className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-5 py-3 text-sm text-gray-400">No results found</div>
            )}
            {filtered.map((o, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  onSelect(o);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full text-left px-5 py-3 hover:bg-indigo-50 transition text-sm"
              >
                <div className="font-bold text-gray-900">{getLabel(o)}</div>
                {getSubLabel && <div className="text-xs text-gray-500">{getSubLabel(o)}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Booking Modal                                              */
/* ------------------------------------------------------------------ */

export function CreateBookingModal({ onClose, onSuccess }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [decorations, setDecorations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const nowStr = useMemo(() => {
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    const adjustedDate = new Date(localDate.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().slice(0, 16);
  }, []);

  const [formData, setFormData] = useState({
    userId: "",
    userLabel: "",
    eventDate: "",
    endDate: "",
    location: "",
    items: [] as { decorationId: string; label: string; price: number; priceUnitHours: number; quantity: number }[],
  });

  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("LOCAL_EVC");
  const [customPayment, setCustomPayment] = useState("");

  useEffect(() => {
    fetch("/api/admin/users?role=ALL")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"));
    fetch("/api/admin/decorations")
      .then((r) => r.json())
      .then(setDecorations)
      .catch(() => toast.error("Failed to load products"));
  }, []);

  const activeDecorations = decorations.filter((d) => d.isActive);

  const durationHours = useMemo(() => {
    if (!formData.eventDate || !formData.endDate) return 0;
    const diff = new Date(formData.endDate).getTime() - new Date(formData.eventDate).getTime();
    return Math.max(0, diff / (1000 * 60 * 60));
  }, [formData.eventDate, formData.endDate]);

  const dateError = useMemo(() => {
    if (!formData.eventDate || !formData.endDate) return "";
    if (new Date(formData.eventDate).getTime() < new Date(nowStr).getTime()) {
      return "Event start cannot be in the past.";
    }
    if (new Date(formData.endDate).getTime() <= new Date(formData.eventDate).getTime()) {
      return "Event end must be after the event start.";
    }
    return "";
  }, [formData.eventDate, formData.endDate, nowStr]);

  // Same calc as the cart: price per item, scaled by duration blocks, same as /cart page
  const itemTotal = (item: (typeof formData.items)[number]) => {
    if (!item.decorationId) return 0;
    if (durationHours === 0) return item.price * item.quantity;
    const unit = item.priceUnitHours || 1;
    const blocks = Math.ceil(durationHours / unit);
    return item.price * blocks * item.quantity;
  };

  const totalPrice = useMemo(() => {
    return formData.items.reduce((acc, item) => acc + itemTotal(item), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.items, durationHours]);

  const depositRequired = Math.round(totalPrice * 0.2 * 100) / 100;
  const actualPaymentAmount = customPayment !== "" ? Number(customPayment) : depositRequired;

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { decorationId: "", label: "", price: 0, priceUnitHours: 1, quantity: 1 }],
    }));
  };

  const selectItemDecoration = (index: number, decoration: any) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      decorationId: decoration.id,
      label: `${decoration.name} ($${decoration.price})`,
      price: decoration.price,
      priceUnitHours: decoration.priceUnitHours || 1,
    };
    setFormData({ ...formData, items: newItems });
  };

  // Same +/- stepper behaviour as the cart page
  const updateQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], quantity: Math.max(1, quantity) };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const validate = () => {
    if (!formData.userId) {
      toast.error("Please select a customer");
      return false;
    }
    if (formData.items.length === 0 || formData.items.some((i) => !i.decorationId)) {
      toast.error("Please add at least one product and select it from the search list");
      return false;
    }
    if (dateError) {
      toast.error(dateError);
      return false;
    }
    if (durationHours <= 0) {
      toast.error("Please enter valid event start and end dates");
      return false;
    }
    if (!formData.location) {
      toast.error("Please select a venue location");
      return false;
    }
    const phoneRegex = /^[1-9]\d{9,19}$/;
    if (!phoneNumber) {
      toast.error("Please enter a mobile number for payment");
      return false;
    }
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Phone number must be in international format without + or leading zero (e.g., 252611111111)");
      return false;
    }
    if (actualPaymentAmount < depositRequired - 0.1) {
      toast.error(`Minimum payment required is $${depositRequired.toFixed(2)}`);
      return false;
    }
    if (actualPaymentAmount > totalPrice + 0.1) {
      toast.error(`Payment cannot exceed the total price of $${totalPrice.toFixed(2)}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setIsPaying(true);
    try {
      // Step 1: charge the customer's mobile wallet — identical shape to /cart's /api/waafi/purchase call
      const trimmedPhone = phoneNumber.trim();
      const paymentRes = await fetch("/api/waafi/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNo: trimmedPhone,
          amount: Math.round(actualPaymentAmount * 100) / 100,
          currency: "USD",
          referenceId: `ADMIN-${Date.now()}`,
        }),
      });

      const waafiData = await paymentRes.json();
      if (!paymentRes.ok || !waafiData.success) {
        toast.error(waafiData.message || "Payment failed. Please check the number and try again.");
        setLoading(false);
        setIsPaying(false);
        return;
      }

      // Step 2: only create the booking once payment has succeeded
      // Uses the same transaction/pricing/availability logic as the
      // online customer flow (/api/bookings), just targeting a chosen userId.
      const res = await fetch("/api/admin/manual-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formData.userId,
          eventDate: formData.eventDate,
          endDate: formData.endDate,
          location: formData.location,
          phoneNumber: trimmedPhone,
          paymentAmount: actualPaymentAmount,
          paymentMethod,
          transactionId: waafiData.transactionId,
          items: formData.items.map((item) => ({
            decorationId: item.decorationId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        let errorMsg = "Payment succeeded but the booking could not be created. Contact support.";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          /* ignore parse error */
        }
        toast.error(errorMsg);
        setLoading(false);
        setIsPaying(false);
        return;
      }

      toast.success("Booking created and payment completed successfully.");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Manual Booking</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-grow">
          {/* Customer search */}
          <SearchableSelect
            label="Customer"
            icon={<User className="w-3 h-3 inline mr-1" />}
            placeholder="Search customer by name or email..."
            displayValue={formData.userLabel}
            options={users}
            getLabel={(u) => u.fullName}
            getSubLabel={(u) => u.email}
            required
            onSelect={(u) =>
              setFormData({ ...formData, userId: u.id, userLabel: `${u.fullName} (${u.email})` })
            }
          />

          {/* Event start / end */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Event Start
              </label>
              <input
                required
                type="datetime-local"
                min={nowStr}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Event End
              </label>
              <input
                required
                type="datetime-local"
                min={formData.eventDate || nowStr}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          {dateError && <p className="text-xs font-bold text-rose-500 -mt-2 ml-1">{dateError}</p>}
          {durationHours > 0 && !dateError && (
            <p className="text-xs font-bold text-gray-400 -mt-2 ml-1">Duration: {durationHours.toFixed(1)} hrs</p>
          )}

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
              <MapPin className="w-3 h-3 inline mr-1" />
              Location
            </label>
            <select
              required
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            >
              <option value="">Select Location...</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Products - same card layout as the /cart page: search + qty stepper + live subtotal */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                <Package className="w-3 h-3 inline mr-1" />
                Products
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 flex items-center"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Product
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-2xl"
              >
                <div className="flex-1 w-full space-y-1">
                  <SearchableSelect
                    placeholder="Search product by name..."
                    displayValue={item.label}
                    options={activeDecorations}
                    getLabel={(d) => d.name}
                    getSubLabel={(d) => `$${d.price} / ${(d.priceUnitHours || 1) === 1 ? "hr" : `${d.priceUnitHours} hrs`}`}
                    required
                    onSelect={(d) => selectItemDecoration(index, d)}
                  />
                  {item.decorationId && (
                    <p className="text-xs text-gray-500 ml-1">
                      ${item.price} / {(item.priceUnitHours || 1) === 1 ? "hr" : `${item.priceUnitHours} hrs`}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-3">
                  <div className="flex items-center gap-4 bg-white px-3 py-2 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="text-gray-500 hover:text-indigo-600 p-1"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="font-bold text-gray-900 w-20 text-right">
                    ${itemTotal(item).toFixed(2)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {formData.items.length === 0 && (
              <p className="text-xs text-center text-gray-500">No products added yet. Click Add Product.</p>
            )}
          </div>

          {/* Payment */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1 flex items-center">
              <DollarSign className="w-3 h-3 inline mr-1 text-emerald-600" />
              Payment
            </label>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1 flex items-center">
                <Phone className="w-3 h-3 inline mr-1" /> Payer Mobile Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 252611111111"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min={depositRequired}
                  max={totalPrice}
                  placeholder={depositRequired.toString()}
                  className="w-full px-5 py-3.5 font-extrabold text-indigo-700 bg-indigo-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20"
                  value={customPayment}
                  onChange={(e) => setCustomPayment(e.target.value)}
                />
                {totalPrice > 0 && (
                  <p className="text-[10px] font-bold text-gray-400 ml-1">
                    Min: ${depositRequired.toFixed(2)} | Max: ${totalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 ml-1">Method</label>
                <select
                  className="w-full px-5 py-3.5 font-bold text-gray-700 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  <optgroup label="Local Mobile Money">
                    <option value="LOCAL_EVC">EVC Plus</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Summary card - same layout/rows as the /cart page's sticky Booking Summary */}
            <div className="bg-indigo-600 rounded-2xl p-5 text-white space-y-3">
              <div className="flex justify-between text-sm pb-3 border-b border-indigo-500/50">
                <span className="opacity-80">Duration</span>
                <span className="font-bold">{durationHours > 0 ? `${durationHours.toFixed(1)} hrs` : "---"}</span>
              </div>
              <div className="flex justify-between text-sm pb-3 border-b border-indigo-500/50">
                <span className="opacity-80">Total Price</span>
                <span className="font-bold">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-80">Paying Now</span>
                <span className="text-lg font-extrabold text-emerald-300">${actualPaymentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-70 pt-2 border-t border-indigo-500/50">
                <span>Remaining Balance</span>
                <span>${Math.max(0, totalPrice - actualPaymentAmount).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              {isPaying ? "Processing payment..." : "Payment securely processed. The booking is only created after payment succeeds."}
            </p>
          </div>

          <div className="pt-8 flex items-center space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.items.length === 0}
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (isPaying ? "Processing payment..." : "Creating...") : `Pay $${actualPaymentAmount.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Booking Modal                                                 */
/* ------------------------------------------------------------------ */

export function EditBookingModal({ booking, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const toLocalInput = (dateString: string) => {
    const d = new Date(dateString);
    const offset = d.getTimezoneOffset();
    const adjusted = new Date(d.getTime() - offset * 60 * 1000);
    return adjusted.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    eventDate: toLocalInput(booking.eventDate),
    endDate: toLocalInput(booking.endDate),
    location: booking.location,
    status: booking.status,
  });

  const dateError = useMemo(() => {
    if (!formData.eventDate || !formData.endDate) return "";
    if (new Date(formData.endDate).getTime() <= new Date(formData.eventDate).getTime()) {
      return "Event end must be after the event start.";
    }
    return "";
  }, [formData.eventDate, formData.endDate]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (dateError) {
      toast.error(dateError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        let errorMsg = "Failed to update booking";
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          /* ignore parse error */
        }
        toast.error(errorMsg);
      } else {
        toast.success("Booking updated");
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Booking Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Event Start
              </label>
              <input
                required
                type="datetime-local"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                <Calendar className="w-3 h-3 inline mr-1" />
                Event End
              </label>
              <input
                required
                type="datetime-local"
                min={formData.eventDate}
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
          {dateError && <p className="text-xs font-bold text-rose-500 -mt-2 ml-1">{dateError}</p>}

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
              <MapPin className="w-3 h-3 inline mr-1" />
              Location
            </label>
            <select
              required
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            >
              <option value="">Select Location...</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Status</label>
            <select
              className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 font-medium text-gray-900 uppercase tracking-wider text-sm"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="pt-8 flex items-center space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] font-bold text-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-100 transition active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}