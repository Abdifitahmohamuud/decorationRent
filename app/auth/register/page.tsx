"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { CheckCircle, ShieldCheck, Mail, Phone, Lock, User as UserIcon, Loader2, ArrowRight } from "lucide-react";

// Full Name: letters + spaces bas (Somali/English), no numbers, no special chars
const nameRegex = /^[A-Za-z\u0600-\u06FF\s]+$/;

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name is too short")
    .regex(nameRegex, "Full name should only contain letters"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(5, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  // Track which fields the user has actually interacted with,
  // so we don't show red borders before they start typing
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
  });

  // OTP States
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // ---- Field validators ----
  const validateField = (field: keyof typeof formData, value: string) => {
    switch (field) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (!nameRegex.test(value)) return "Only letters are allowed, no numbers or symbols";
        if (value.trim().length < 2) return "Full name is too short";
        return "";
      case "email":
        return z.string().email().safeParse(value).success ? "" : "Enter a valid email address";
      case "phone":
        return value.trim().length >= 5 ? "" : "Phone number is required";
      case "password":
        return value.length >= 6 ? "" : "Password must be at least 6 characters";
      default:
        return "";
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  // Overall form validity (used to enable/disable the submit button)
  const isFormValid =
    validateField("fullName", formData.fullName) === "" &&
    validateField("email", formData.email) === "" &&
    validateField("phone", formData.phone) === "" &&
    validateField("password", formData.password) === "" &&
    isVerified;

  const inputClass = (field: keyof typeof formData) =>
    `w-full pl-12 pr-4 py-4 border rounded-2xl text-sm font-bold focus:ring-2 transition disabled:opacity-60 ${touched[field] && fieldErrors[field]
      ? "bg-red-50 border-red-300 focus:ring-red-200 focus:bg-white"
      : "bg-gray-50 border-transparent focus:ring-indigo-600/10 focus:bg-white"
    }`;

  const sendOtp = async () => {
    const emailError = validateField("email", formData.email);
    if (emailError) {
      setTouched((prev) => ({ ...prev, email: true }));
      setFieldErrors((prev) => ({ ...prev, email: emailError }));
      return setError("Please enter a valid email to verify");
    }
    setSendingOtp(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      if (!res.ok) throw new Error("Failed to send code");
      setShowOtp(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 5) return;
    setIsVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      if (!res.ok) throw new Error("Invalid or expired code");
      setIsVerified(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Run full validation on submit (in case fields weren't "touched")
    const newFieldErrors = {
      fullName: validateField("fullName", formData.fullName),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      password: validateField("password", formData.password),
    };
    setFieldErrors(newFieldErrors);
    setTouched({ fullName: true, email: true, phone: true, password: true });

    const hasFieldErrors = Object.values(newFieldErrors).some((msg) => msg !== "");
    if (hasFieldErrors) return;

    if (!isVerified) return setError("Please verify your email first");

    setLoading(true);
    setError("");

    try {
      const validatedData = registerSchema.parse(formData);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed. Try again.");
      }

      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-8 shadow-2xl rounded-[2.5rem] border border-gray-100 space-y-8">

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-100 mb-4 transform hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Join the Elite</h2>
            <p className="text-gray-400 font-medium text-sm">Create your premium decoration account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="p-4 text-xs font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    required
                    className={inputClass("fullName")}
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                  />
                </div>
                {touched.fullName && fieldErrors.fullName && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-2">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email with Verification */}
              <div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    disabled={isVerified}
                    required
                    className={`${inputClass("email")} pr-24`}
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                  />
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={sendOtp}
                      disabled={sendingOtp}
                      className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {sendingOtp ? "..." : "Verify"}
                    </button>
                  )}
                  {isVerified && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                {touched.email && fieldErrors.email && !isVerified && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-2">{fieldErrors.email}</p>
                )}
              </div>

              {/* OTP Input Section */}
              {showOtp && !isVerified && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between animate-fadeInUp">
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="5-Digit OTP"
                    className="bg-transparent border-none focus:ring-0 text-center font-black text-indigo-600 tracking-[0.5em] w-2/3 text-lg"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      if (e.target.value.length === 5) verifyOtp();
                    }}
                  />
                  {isVerifying && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
                  {!isVerifying && (
                    <button type="button" onClick={verifyOtp} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                      Apply
                    </button>
                  )}
                </div>
              )}

              {/* Phone */}
              <div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    required
                    className={inputClass("phone")}
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                  />
                </div>
                {touched.phone && fieldErrors.phone && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-2">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition" />
                  <input
                    type="password"
                    placeholder="Secure Password"
                    required
                    className={inputClass("password")}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                  />
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="text-[11px] font-bold text-red-500 mt-1.5 ml-2">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 hover:gap-4 transition-all disabled:opacity-50 disabled:hover:gap-2 shadow-xl shadow-indigo-100 mt-4 h-14"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Build My Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/auth/login" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition uppercase tracking-wider">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}