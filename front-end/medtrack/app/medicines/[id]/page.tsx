"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getMedicineById,
  purchaseMedicine,
  type Medicine,
} from "@/lib/api/medicine";
import { getUser, isAuthenticated } from "@/lib/utils/token";

export default function MedicineDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const user = getUser();
    setIsAdmin(user?.role === "admin");
    fetchMedicine();
  }, [router, params.id]);

  const fetchMedicine = async () => {
    try {
      setLoading(true);
      const response = await getMedicineById(params.id);
      if (response.success && response.data && !Array.isArray(response.data)) {
        setMedicine(response.data);
      } else {
        setError(response.message || "Medicine not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load medicine");
      if (err.statusCode === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading medicine details...</p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error || "Medicine not found"}</p>
          <Link href="/medicines" className="text-indigo-600 hover:text-indigo-500">
            Back to Medicines
          </Link>
        </div>
      </div>
    );
  }

  const expired = new Date(medicine.expiryDate) < new Date();

  const handleBuy = async () => {
    if (!medicine) return;
    const quantity = Math.min(Math.max(1, buyQuantity), Math.max(1, medicine.quantity));

    try {
      setIsBuying(true);
      const response = await purchaseMedicine(medicine._id, quantity);
      if (!response.success) {
        alert(response.message || "Failed to purchase medicine");
        return;
      }

      const updatedQty = Math.max(0, medicine.quantity - quantity);
      setMedicine({ ...medicine, quantity: updatedQty });
      setBuyQuantity(1);
      alert("Medicine purchased successfully");
    } catch (err: any) {
      alert(err.message || "Failed to purchase medicine");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Medicine Details</h1>
          <Link
            href="/medicines"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Back to Medicines
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-64 bg-linear-to-br from-indigo-100 to-blue-100">
            {medicine.image?.url ? (
              <img
                src={medicine.image.url}
                alt={medicine.medicineName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-indigo-300">
                No image
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">{medicine.medicineName}</h2>
                <p className="text-sm text-slate-500 mt-1">{medicine.category}</p>
              </div>
              <p className="text-3xl font-bold text-indigo-600">${medicine.price.toFixed(2)}</p>
            </div>

            {medicine.description && (
              <p className="text-slate-700 leading-relaxed">{medicine.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 uppercase">Manufacturer</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{medicine.manufacturer}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 uppercase">Batch Number</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{medicine.batchNumber}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 uppercase">Quantity in Stock</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{medicine.quantity} units</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 uppercase">Expiry Date</p>
                <p className={`text-sm font-semibold mt-1 ${expired ? "text-red-600" : "text-slate-900"}`}>
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {!isAdmin && (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-black mb-3">Buy this medicine</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-black">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={medicine.quantity}
                      value={buyQuantity}
                      onChange={(e) =>
                        setBuyQuantity(
                          Math.min(
                            Math.max(1, Number(e.target.value) || 1),
                            Math.max(1, medicine.quantity)
                          )
                        )
                      }
                      className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm text-black font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleBuy}
                    disabled={medicine.quantity <= 0 || isBuying}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBuying ? "Purchasing..." : "Buy Now"}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <Link
                href={isAdmin ? "/admin/dashboard" : "/dashboard"}
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
