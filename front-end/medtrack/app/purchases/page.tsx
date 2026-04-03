"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPurchaseHistory,
  type PurchaseHistoryItem,
} from "@/lib/api/medicine";
import { getUser, isAuthenticated } from "@/lib/utils/token";
import { getSocket } from "@/lib/socket";

export default function PurchasesPage() {
  const router = useRouter();
  const [items, setItems] = useState<PurchaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setUser(getUser());
    fetchHistory();
  }, [router]);

  useEffect(() => {
    const socket = getSocket();
    const onPurchaseCreated = () => fetchHistory();
    socket.on("analytics:purchaseCreated", onPurchaseCreated);
    return () => {
      socket.off("analytics:purchaseCreated", onPurchaseCreated);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await getPurchaseHistory();
      if (response.success && response.data) {
        setItems(response.data);
      } else {
        setError(response.message || "Failed to load purchase history");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load purchase history");
      if (err.statusCode === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isAdmin ? "All Purchase History" : "My Purchase History"}
          </h1>
          <Link
            href={isAdmin ? "/admin/dashboard" : "/dashboard"}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && <div className="mb-4 text-sm text-red-700">{error}</div>}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-600">Loading history...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-slate-600">No purchases yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Medicine</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs text-slate-500">Buyer</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Payment</th>
                  <th className="px-4 py-3 text-left text-xs text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm text-slate-800">{item.medicine?.medicineName}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.buyer?.fullname || item.buyer?.email}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">${item.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.paymentStatus ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            item.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.paymentStatus === "PENDING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
