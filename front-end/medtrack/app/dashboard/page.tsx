"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, logoutUser } from "@/lib/api/auth";
import { getUser, isAuthenticated } from "@/lib/utils/token";

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get user from localStorage first
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
      setLoading(false);
    }

    // Fetch fresh user data from API
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const response = await getCurrentUser();
      if (response.user) {
        setUser(response.user);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load user data");
      if (err.statusCode === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    alert("You have been logged out.");
    logoutUser();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">No user data found</p>
          <Link
            href="/login"
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  const profileInitials =
    (user.fullname || "")
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0)
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    (user.email?.charAt(0).toUpperCase() ?? "?");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Welcome to MedTrack
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Hello, {user.fullname || user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                Profile
              </button>
              <Link
                href="/medicines"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                Medicines
              </Link>
              <Link
                href="/purchases"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                Purchases
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Animated Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sticky top-8">
              <h2 className="text-sm font-bold text-slate-900 mb-4 px-2 uppercase tracking-wide">
                Navigation
              </h2>
              <nav className="relative">
                {/* Animated Slider Background */}
                <div
                  className="absolute left-0 w-full bg-indigo-100 rounded-xl transition-all duration-300 ease-out"
                  style={{
                    height: '48px',
                    top: `${activeTab === 'profile' ? 0 : activeTab === 'medicines' ? 56 : 112}px`,
                    opacity: 0.3,
                  }}
                />
                
                <div className="relative space-y-2">
                  <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <svg
                      className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className={`font-medium text-sm ${activeTab === 'profile' ? 'font-semibold' : ''}`}>
                      Profile
                    </span>
                    {activeTab === 'profile' && (
                      <svg
                        className="w-4 h-4 ml-auto animate-pulse"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  <Link
                    href="/medicines"
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                      activeTab === 'medicines'
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                    }`}
                    onClick={() => setActiveTab('medicines')}
                  >
                    <svg
                      className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'medicines' ? 'scale-110' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className={`font-medium text-sm ${activeTab === 'medicines' ? 'font-semibold' : ''}`}>
                      Medicines
                    </span>
                    {activeTab === 'medicines' && (
                      <svg
                        className="w-4 h-4 ml-auto animate-pulse"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>

                  <div
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                      activeTab === 'activity'
                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                    }`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <svg
                      className={`w-5 h-5 shrink-0 transition-transform ${activeTab === 'activity' ? 'scale-110' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`font-medium text-sm ${activeTab === 'activity' ? 'font-semibold' : ''}`}>
                      Activity
                    </span>
                    {activeTab === 'activity' && (
                      <svg
                        className="w-4 h-4 ml-auto animate-pulse"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* User Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Your Profile
                  </h2>
                  <div className="flex flex-col md:flex-row gap-8">
                    {user.profilePicture?.url && (
                      <div className="shrink-0">
                        <img
                          src={user.profilePicture.url}
                          alt="Profile"
                          className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-indigo-100"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-6">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Full Name
                        </label>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{user.fullname}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Email
                        </label>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "medicines" && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Browse Medicines
                </h2>
                <Link
                  href="/medicines"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View All Medicines
                </Link>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Recent Activity
                </h2>
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">
                    No recent activity to display
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Your activity and records will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-8">
            <p className="text-slate-600 text-sm">
              No recent activity to display
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Your activity and records will appear here
            </p>
          </div>
        </div>
      </main>

      {/* Profile Slide-in Sidebar */}
      <>
        <div
          className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            isProfileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={!isProfileOpen}
          onClick={() => setIsProfileOpen(false)}
        />
        <div
          className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col rounded-l-3xl border-l border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-900/5 transition-transform duration-300 ease-out ${
            isProfileOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-drawer-title"
        >
          <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-700 px-6 pb-10 pt-6">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 left-1/4 h-24 w-24 rounded-full bg-violet-500/20"
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200/90">
                  MedTrack
                </p>
                <h2
                  id="profile-drawer-title"
                  className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl"
                >
                  Your profile
                </h2>
                <p className="mt-1 text-sm text-indigo-100/95">
                  Signed in as {user.fullname || user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="shrink-0 rounded-full p-2.5 text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                aria-label="Close profile panel"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative -mb-14 mt-8 flex justify-center">
              <div className="relative">
                {user.profilePicture?.url ? (
                  <img
                    src={user.profilePicture.url}
                    alt="Profile photo"
                    className="h-28 w-28 rounded-2xl object-cover shadow-lg ring-4 ring-white/90"
                  />
                ) : (
                  <div
                    className="flex h-28 w-28 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-400 to-violet-500 text-2xl font-bold text-white shadow-lg ring-4 ring-white/90"
                    aria-hidden
                  >
                    {profileInitials}
                  </div>
                )}
                <span
                  className="absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-emerald-500 shadow-sm"
                  aria-hidden
                />
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden bg-slate-50/90">
            <div className="flex-1 overflow-y-auto px-5 pb-6 pt-16">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Full name
                      </p>
                      <p className="mt-0.5 truncate text-base font-semibold text-slate-900">
                        {user.fullname || "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </p>
                      <p className="mt-0.5 break-all text-sm font-medium leading-snug text-slate-800">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="mb-3 px-0.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick links
                </h3>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/medicines"
                    onClick={() => setIsProfileOpen(false)}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-200">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 group-hover:text-indigo-700">
                        Medicines
                      </span>
                      <span className="text-xs text-slate-500">Browse catalog</span>
                    </span>
                    <svg className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 transition group-hover:bg-sky-200">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 group-hover:text-sky-700">
                        Dashboard
                      </span>
                      <span className="text-xs text-slate-500">Overview &amp; settings</span>
                    </span>
                    <svg className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    href="/purchases"
                    onClick={() => setIsProfileOpen(false)}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition group-hover:bg-emerald-200">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900 group-hover:text-emerald-700">
                        Purchases
                      </span>
                      <span className="text-xs text-slate-500">Order history</span>
                    </span>
                    <svg className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </nav>
              </div>
            </div>

            <div className="border-t border-slate-200/90 bg-white/95 p-5 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
}

