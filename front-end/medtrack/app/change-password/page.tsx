"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { changeFirstPassword } from "@/lib/api/auth/auth.service";
import { isAuthenticated } from "@/lib/utils/token";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await changeFirstPassword({ currentPassword, newPassword });
      if (response.success) {
        router.push("/dashboard");
      } else {
        setError(response.message || "Failed to change password.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl bg-white px-8 py-10 shadow-lg ring-1 ring-slate-100">
        <h1 className="text-2xl font-semibold text-slate-900">Change Password</h1>
        <p className="mt-2 text-sm text-slate-600">
          For security reasons, please change your temporary password before accessing the dashboard.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Temporary Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter current temporary password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
