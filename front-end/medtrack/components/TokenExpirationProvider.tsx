"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAndClearExpiredToken } from "@/lib/utils/token";

/**
 * TokenExpirationProvider
 * Periodically checks if the token has expired (30 minutes)
 * and automatically logs out the user if expired
 */
export default function TokenExpirationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check token expiration immediately
    const checkExpiration = () => {
      if (checkAndClearExpiredToken()) {
        // Token was expired and cleared
        // Redirect to appropriate page based on current route
        if (pathname?.startsWith("/admin")) {
          router.push("/admin");
        } else if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/medicines")) {
          router.push("/login");
        }
      }
    };

    // Check immediately
    checkExpiration();

    // Set up interval to check every minute
    const interval = setInterval(checkExpiration, 60 * 1000); // Check every 60 seconds

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkExpiration();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, pathname]);

  return <>{children}</>;
}

