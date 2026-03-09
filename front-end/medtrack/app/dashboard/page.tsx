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
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${activeTab === 'profile' ? 'scale-110' : ''}`}
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
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${activeTab === 'medicines' ? 'scale-110' : ''}`}
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
                      className={`w-5 h-5 flex-shrink-0 transition-transform ${activeTab === 'activity' ? 'scale-110' : ''}`}
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
                      <div className="flex-shrink-0">
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
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
            isProfileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsProfileOpen(false)}
        />
        {/* Sidebar */}
        <div
          className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            isProfileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                  <p className="text-sm text-indigo-100 mt-1">Account Information</p>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Profile Picture */}
                {user.profilePicture?.url && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={user.profilePicture.url}
                      alt="Profile"
                      className="w-32 h-32 rounded-2xl object-cover shadow-xl border-4 border-indigo-100"
                    />
                  </div>
                )}

                {/* Profile Information */}
                <div className="space-y-6">
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

                {/* Quick Navigation */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">
                    Quick Navigation
                  </h3>
                  <div className="space-y-2">
                    <Link
                      href="/medicines"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-900 group-hover:text-indigo-600">View Medicines</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-900 group-hover:text-blue-600">Dashboard</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
      </>
    </div>
  );
}

