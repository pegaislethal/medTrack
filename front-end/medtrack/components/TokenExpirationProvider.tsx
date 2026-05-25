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
    const reloadKey = "medtrack_chunk_reload_attempted";

    const handleChunkLoadError = (event: Event) => {
      const rejection = event as PromiseRejectionEvent;
      const reason = "reason" in rejection ? rejection.reason : undefined;
      const message =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
            ? reason.message
            : "";

      const isChunkLoadError =
        reason?.name === "ChunkLoadError" ||
        message.includes("ChunkLoadError") ||
        message.includes("Failed to load chunk") ||
        message.includes("Loading chunk");

      if (!isChunkLoadError) {
        return;
      }

      if (sessionStorage.getItem(reloadKey) === "1") {
        console.error("[chunk] ChunkLoadError repeated after reload, giving up", {
          pathname,
          message,
        });
        return;
      }

      sessionStorage.setItem(reloadKey, "1");
      console.warn("[chunk] ChunkLoadError detected, reloading page once", {
        pathname,
        message,
      });
      window.location.reload();
    };

    window.addEventListener("unhandledrejection", handleChunkLoadError);
    window.addEventListener("error", handleChunkLoadError);

    return () => {
      window.removeEventListener("unhandledrejection", handleChunkLoadError);
      window.removeEventListener("error", handleChunkLoadError);
    };
  }, [pathname]);

  useEffect(() => {
    // Check token expiration immediately
    const checkExpiration = () => {
      // Allow public routes that don't need a token
      const publicRoutes = ["/login", "/signup", "/admin", "/admin/signup", "/forgot-password"];
      if (pathname && publicRoutes.some(route => pathname === route || pathname.startsWith(route + "?"))) {
        return;
      }

      if (checkAndClearExpiredToken()) {
        // Token was expired and cleared
        // Redirect to appropriate page based on current route
        if (pathname?.startsWith("/admin")) {
          router.push("/admin");
        } else if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/medicines") || pathname?.startsWith("/purchases")) {
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

