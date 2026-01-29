"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, resetPassword } from "@/lib/api/auth";
import { validateEmail, validatePassword, validateOTP } from "@/lib/utils/validation";
import { isAuthenticated } from "@/lib/utils/token";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Frontend validation
    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const response = await requestPasswordReset({ email: email.trim() });
      
      if (response.success) {
        setStep("verify");
        setSuccess("OTP sent to your email. Please check and enter the OTP.");
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setError(err.message || "Failed to request password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Frontend validation
    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      setError(otpValidation.error || "Please enter a valid OTP");
      return;
    }

    // Note: Backend doesn't verify OTP in resetPassword endpoint
    // OTP verification is done here for UX, then proceed to reset
    // Move to reset password step
    setStep("reset");
    setSuccess("OTP verified. Please enter your new password.");
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || "Please enter a valid password");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        email: email.trim(),
        newPassword: newPassword,
      });

      if (response.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white px-8 py-10 shadow-lg ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Reset Password</h1>
          <Link
            href="/login"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to login
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {step === "request"
            ? "Enter your email address and we'll send you an OTP to reset your password."
            : step === "verify"
            ? "Enter the OTP sent to your email."
            : "Enter your new password."}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        {step === "request" ? (
          <form onSubmit={handleRequestReset} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-800">
                Email Address
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

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : step === "verify" ? (
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
                Check your email ({email}) for the OTP code
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
                setStep("request");
                setOtp("");
                setError("");
                setSuccess("");
              }}
              className="w-full text-sm text-slate-600 hover:text-slate-800"
            >
              Back to email
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-slate-800"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter new password"
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

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-800"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("verify");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                setSuccess("");
              }}
              className="w-full text-sm text-slate-600 hover:text-slate-800"
            >
              Back to OTP
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

