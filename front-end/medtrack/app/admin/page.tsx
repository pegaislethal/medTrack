"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, verifyAdminLoginOTP } from "@/lib/api/admin";
import { validateLogin, validateOTP } from "@/lib/utils/validation";
import { isAuthenticated, getUser } from "@/lib/utils/token";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"login" | "otp">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      // Check if user is admin (has role property)
      if (user && user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        // Regular user logged in, redirect to user dashboard
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Frontend validation before API call
    const validation = validateLogin(email.trim(), password);
    if (!validation.valid) {
      setError(validation.error || "Please check your input");
      return;
    }

    setLoading(true);

    try {
      const response = await loginAdmin({ email: email.trim(), password });
      
      if (response.status === "otp_required") {
        setStep("otp");
      } else {
        setError(response.message || "An error occurred");
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Frontend validation before API call
    const validation = validateOTP(otp);
    if (!validation.valid) {
      setError(validation.error || "Please enter a valid OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyAdminLoginOTP({ email: email.trim(), otp });
      
      if (response.status === "success" && response.token) {
        // Token is automatically saved in verifyAdminLoginOTP function
        // Verify token was saved
        if (typeof window !== 'undefined') {
          const savedToken = localStorage.getItem('medtrack_token');
          if (!savedToken) {
            console.error('Token was not saved to localStorage');
            setError('Login successful but token storage failed. Please try again.');
            return;
          }
        }
        
        // Redirect to admin dashboard
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(response.message || "OTP verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white px-8 py-10 shadow-lg ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Login</h1>
            <p className="mt-1 text-xs font-medium text-indigo-600 uppercase tracking-wide">
              MedTrack Administration
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {step === "login"
            ? "Access the admin dashboard to manage users and system settings."
            : "Enter the OTP sent to your email to complete admin login."}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {step === "login" ? (
          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                Admin Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="admin@medtrack.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-800"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-slate-800">
                OTP Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-center tracking-widest"
                placeholder="000000"
              />
              <p className="text-xs text-slate-500">
                Check your email for the OTP code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("login");
                setOtp("");
                setError("");
              }}
              className="w-full text-sm text-slate-600 hover:text-slate-800"
            >
              Back to login
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-200 pt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an admin account?{" "}
            <Link
              href="/admin/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Create one
            </Link>
          </p>
          <p className="text-center text-sm text-slate-600">
            Not an admin?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              User Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

