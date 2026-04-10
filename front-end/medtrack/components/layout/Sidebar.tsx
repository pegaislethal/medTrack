"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Pill, 
  ShoppingCart, 
  Users, 
  BellRing,
  Menu,
  X
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Medicines", href: "/medicines", icon: Pill },
    { name: "Billing", href: "/billing", icon: ShoppingCart },
    { name: "Pharmacists", href: "/pharmacists", icon: Users },
    { name: "Alerts", href: "/alerts", icon: BellRing },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 focus:outline-none"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full px-4 py-6 overflow-y-auto flex flex-col">
          <div className="flex items-center gap-3 px-2 mb-8 mt-12 lg:mt-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-indigo-800">
              MedTrack
            </span>
          </div>

          <nav className="space-y-1 flex-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'
                  }`} />
                  <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>
          
          <div className="mt-auto p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 font-medium">MedTrack OS v2.0</p>
            <p className="text-[10px] text-slate-400 mt-1">Pharmacy Management</p>
          </div>
        </div>
      </aside>
    </>
  );
}
