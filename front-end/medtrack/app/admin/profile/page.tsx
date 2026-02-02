"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logoutAdmin } from "@/lib/api/admin";
import { getUser, isAuthenticated } from "@/lib/utils/token";

export default function AdminProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/admin");
      return;
    }

    const adminData = getUser();
    setAdmin(adminData);
  }, [router]);

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin");
  };

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", href: "#profile" },
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", href: "/admin/dashboard" },
    { id: "medicines", label: "Medicines", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", href: "/medicines" },
    { id: "add-medicine", label: "Add Medicine", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", href: "/medicines/add" },
    { id: "users", label: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", href: "/admin/users" },
  ];

  const getActiveIndex = () => {
    return navItems.findIndex(item => item.id === activeTab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Admin Profile
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage your admin account
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {admin.role || "Admin"}
              </span>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    top: `${getActiveIndex() * 56}px`,
                    opacity: 0.3,
                  }}
                />
                
                <div className="relative space-y-2">
                  {navItems.map((item, index) => {
                    const isActive = activeTab === item.id;
                    const isLink = item.href.startsWith('/');
                    
                    const content = (
                      <div
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
                        }`}
                        onClick={() => !isLink && setActiveTab(item.id)}
                      >
                        <svg
                          className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                        <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <svg
                            className="w-4 h-4 ml-auto animate-pulse"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    );

                    return isLink ? (
                      <Link key={item.id} href={item.href}>
                        {content}
                      </Link>
                    ) : (
                      <div key={item.id}>{content}</div>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">
                    Profile Information
                  </h2>
                  <div className="flex flex-col md:flex-row gap-8">
                    {admin.profilePicture?.url && (
                      <div className="flex-shrink-0">
                        <img
                          src={admin.profilePicture.url}
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
                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {admin.fullname || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Email
                        </label>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{admin.email}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                          Role
                        </label>
                        <p className="mt-2">
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800">
                            {admin.role || "Admin"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-sm font-medium">Total Access</p>
                        <p className="text-3xl font-bold mt-2">Admin</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Account Status</p>
                        <p className="text-3xl font-bold mt-2">Active</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Permissions</p>
                        <p className="text-3xl font-bold mt-2">Full</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

