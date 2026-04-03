"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const reasonText: Record<string, string> = {
  missing_order: "No order reference was returned.",
  order_not_found: "We could not find that order.",
  medicine_missing: "The product is no longer available.",
  stock: "Not enough stock to complete this order.",
  server: "Something went wrong on our side. Please try again.",
};

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Payment did not complete</h1>
        <p className="mt-2 text-sm text-slate-600">
          {reasonText[reason] ||
            "The payment was cancelled or failed. You can try again from the product page."}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/medicines"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Back to medicines
          </Link>
          <Link
            href="/purchases"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Purchase history
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
          Loading…
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
