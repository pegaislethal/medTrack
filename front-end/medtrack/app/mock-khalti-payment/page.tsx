"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MOCK_KHALTI_ID = "9800000000";
const MOCK_KHALTI_MPIN = "1111";
const MOCK_KHALTI_OTP = "987654";

function MockKhaltiPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pidx = searchParams.get("pidx") || "";
  const orderId = searchParams.get("orderId") || "";
  const amount = searchParams.get("amount") || "0";
  const [khaltiId, setKhaltiId] = useState("");
  const [mpin, setMpin] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp">("login");
  const [error, setError] = useState("");

  const redirectWithStatus = (status: string) => {
    const params = new URLSearchParams({ pidx, status });
    router.push(`/payment-success?${params.toString()}`);
  };

  const handlePay = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (step === "login") {
      if (khaltiId !== MOCK_KHALTI_ID || mpin !== MOCK_KHALTI_MPIN) {
        setError("Invalid demo Khalti ID or MPIN.");
        return;
      }

      setStep("otp");
      return;
    }

    if (otp !== MOCK_KHALTI_OTP) {
      setError("Invalid demo OTP.");
      return;
    }

    redirectWithStatus("Completed");
  };

  const handleCancel = () => {
    redirectWithStatus("User canceled");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            MedTrack Mock Khalti Payment
          </h1>
          <p className="mt-2 text-sm font-medium text-purple-700">
            This is a demo payment page. No real money is used.
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Order ID</span>
            <span className="font-semibold text-slate-900 text-right break-all">
              {orderId || "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-900">
              Rs {Number(amount).toFixed(2)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handlePay} className="mt-6 space-y-4">
          {step === "login" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Khalti ID
                </label>
                <input
                  value={khaltiId}
                  onChange={(e) => setKhaltiId(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="9800000000"
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  MPIN
                </label>
                <input
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="1111"
                  maxLength={4}
                  type="password"
                  required
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center tracking-widest text-sm outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="987654"
                maxLength={6}
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700"
            >
              {step === "login" ? "Pay" : "Verify OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MockKhaltiPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
          Loading...
        </div>
      }
    >
      <MockKhaltiPaymentContent />
    </Suspense>
  );
}
