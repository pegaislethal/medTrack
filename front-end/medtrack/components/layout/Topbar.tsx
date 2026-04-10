"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { getUser, removeToken } from "@/lib/utils/token";

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const data = getUser();
    if (data) setUser(data);
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/admin");
  };

  const initials = user?.fullname 
    ? user.fullname.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || "A";

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 lg:translate-x-0">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between lg:pl-8">
        
        {/* Placeholder for mobile toggle spacing */}
        <div className="w-10 lg:hidden"></div>

        {/* Global Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search medicines, batches..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/alerts" className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </Link>
          
          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 pl-2 pr-3 hover:bg-slate-50 rounded-full transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white shadow-sm">
                {initials}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate leading-tight">
                  {user?.fullname || "Staff"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-tight">{user?.role || "Pharmacist"}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
            </button>

            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullname}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
