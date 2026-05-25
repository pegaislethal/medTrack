"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyKhaltiPayment } from "@/lib/api/payment";

type VerificationState = "checking" | "success" | "pending" | "failed";

function KhaltiCallbackContent() {
  const searchParams = useSearchParams();
  const pidx = searchParams.get("pidx");
  const callbackStatus = searchParams.get("status");
  const [state, setState] = useState<VerificationState>("checking");
  const [message, setMessage] = useState("Verifying your Khalti payment...");

  useEffect(() => {
    if (!pidx) {
      setState("failed");
      setMessage("Khalti did not return a payment reference.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await verifyKhaltiPayment(pidx);
        const paymentStatus = response.data?.status;
        const khaltiStatus =
          response.data?.khaltiStatus || response.status || callbackStatus;

        if (response.success && paymentStatus === "PAID") {
          setState("success");
          setMessage("Your Khalti payment was verified. You can view it in sales history.");
          return;
        }

        if (paymentStatus === "PENDING") {
          setState("pending");
          setMessage(`Your Khalti payment is ${khaltiStatus || "pending"}. Please check again later.`);
          return;
        }

        setState("failed");
        setMessage(`Khalti payment was not completed${khaltiStatus ? `: ${khaltiStatus}` : ""}.`);
      } catch (err: unknown) {
        setState("failed");
        const errorMessage =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Khalti payment verification failed.";
        setMessage(errorMessage || "Khalti payment verification failed.");
      }
    };

    verifyPayment();
  }, [pidx, callbackStatus]);

  const isSuccess = state === "success";
  const isChecking = state === "checking";
  const isPending = state === "pending";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div
        className={`max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-sm ${
          isSuccess
            ? "border-emerald-200"
            : isPending || isChecking
              ? "border-amber-200"
              : "border-red-200"
        }`}
      >
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : isPending || isChecking
                ? "bg-amber-100 text-amber-600"
                : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isChecking ? (
            <div className="h-7 w-7 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          {isSuccess
            ? "Payment confirmed"
            : isChecking
              ? "Verifying payment"
              : isPending
                ? "Payment pending"
                : "Payment not completed"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/sales"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            View sales
          </Link>
          <Link
            href="/medicines"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function KhaltiCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
          Loading...
        </div>
      }
    >
      <KhaltiCallbackContent />
    </Suspense>
  );
}
