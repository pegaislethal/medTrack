"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { isAuthenticated } from "@/lib/utils/token";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const authCheck = window.setTimeout(() => {
      if (!isAuthenticated()) {
        router.push("/admin");
        setCanRender(false);
        return;
      }

      setCanRender(true);
    }, 0);

    return () => window.clearTimeout(authCheck);
  }, [router]);

  if (!canRender) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen transition-all duration-300">
        <Topbar />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
