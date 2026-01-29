"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, verifyLoginOTP } from "@/lib/api/auth/auth.service";
import { validateLogin, validateOTP } from "@/lib/utils/validation";
import { isAuthenticated, getUser } from "@/lib/utils/token";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const response = await loginUser({ email: email.trim(), password });
      
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
      const response = await verifyLoginOTP({ email: email.trim(), otp });
      
      if (response.status === "success" && response.token) {
        // Token is automatically saved in verifyLoginOTP function
        // Verify token was saved
        if (typeof window !== 'undefined') {
          const savedToken = localStorage.getItem('medtrack_token');
          if (!savedToken) {
            console.error('Token was not saved to localStorage');
            setError('Login successful but token storage failed. Please try again.');
            return;
          }
        }
        
        // Redirect to user dashboard
        router.push("/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white px-8 py-10 shadow-lg ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to home
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {step === "login"
            ? "Access your MedTrack account to view records and appointments."
            : "Enter the OTP sent to your email to complete login."}
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
                Email
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
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-800"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.29 3.29L12 12m-3.59-3.59L12 12m0 0l3.59 3.59M12 12l3.59-3.59m0 0a9.953 9.953 0 013.29-3.29M15.59 8.41L12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
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

        <div className="mt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">
            <Link
              href="/forgot-password"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </p>
          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

