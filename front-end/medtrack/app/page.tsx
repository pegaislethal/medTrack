"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, getUser } from "@/lib/utils/token";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();

      if (user?.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50 px-6 py-10">
      <main className="w-full max-w-5xl rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
        <div className="grid gap-12 px-10 py-12 md:grid-cols-2 md:px-14 md:py-16">
          <div className="flex flex-col gap-6">
            <p className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              MedTrack
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Secure healthcare access for patients and providers.
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              Log in to manage appointments, records, and communications. New
              here? Create an account to get started.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Go to login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                Create account
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/70 px-8 py-10 text-indigo-900">
            <h2 className="text-xl font-semibold">What&apos;s inside</h2>
            <ul className="space-y-3 text-sm leading-6">
              <li>• Patient dashboard for medicine.</li>
              <li>• Provider tools to manage medicine carts.</li>
              <li>• Secure website with encrypted data transmission.</li>
              <li>• Quick onboarding for new users with sign-up flow.</li>
            </ul>
            <p className="text-xs text-indigo-800/70">
              Continue to login or sign up to access your MedTrack workspace.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
