"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getMedicineById, type Medicine } from "@/lib/api/medicine";
import {
  getPaymentConfig,
  initiatePayment,
  type PaymentConfig,
} from "@/lib/api/payment";
import { getUser, isAuthenticated } from "@/lib/utils/token";
import { getSocket } from "@/lib/socket";

export default function MedicineDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [paymentSession, setPaymentSession] = useState<{
    orderId: string;
    amount: number;
    qrData: string;
    quantity: number;
    unitPrice: number;
    medicine: {
      _id: string;
      medicineName: string;
      batchNumber: string;
      price: number;
    };
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const user = getUser();
    setIsAdmin(user?.role === "admin");
    fetchMedicine();
    getPaymentConfig()
      .then((res) => {
        if (res.success && res.data) setPaymentConfig(res.data);
      })
      .catch(() => {
        /* optional: show inline notice */
      });
  }, [router, params.id]);

  useEffect(() => {
    if (!paymentSession?.orderId) return;
    const socket = getSocket();
    const room = paymentSession.orderId;
    socket.emit("joinOrderRoom", room);
    const onPaymentUpdate = (payload: { status: string; orderId: string }) => {
      if (payload.orderId !== room) return;
      if (payload.status === "PAID") {
        setPaymentSession(null);
        fetchMedicine();
        alert("Payment successful — your order is confirmed.");
      }
      if (payload.status === "FAILED") {
        setPaymentSession(null);
        alert("Payment was cancelled or failed.");
      }
    };
    socket.on("paymentUpdate", onPaymentUpdate);
    return () => {
      socket.emit("leaveOrderRoom", room);
      socket.off("paymentUpdate", onPaymentUpdate);
    };
  }, [paymentSession?.orderId]);

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
      const response = await initiatePayment({
        medicine: medicine._id,
        quantity,
        unitPrice: medicine.price,
      });
      if (!response.success || !response.data) {
        alert(response.message || "Could not start payment");
        return;
      }
      setPaymentSession({
        orderId: response.data.orderId,
        amount: response.data.amount,
        qrData: response.data.qrData,
        quantity,
        unitPrice: medicine.price,
        medicine: {
          _id: medicine._id,
          medicineName: medicine.medicineName,
          batchNumber: medicine.batchNumber,
          price: medicine.price,
        },
      });
    } catch (err: any) {
      alert(err.message || "Could not start payment");
    } finally {
      setIsBuying(false);
    }
  };

  const handleFakeConfirm = () => {
    if (!paymentSession) return;

    const currentUser = getUser();
    const buyerEmail = currentUser?.email || "unknown";
    const buyerId = currentUser?.userId || currentUser?.id || currentUser?._id || "local";

    const fakeActivity = {
      _id: paymentSession.orderId,
      orderId: paymentSession.orderId,
      quantity: paymentSession.quantity,
      unitPrice: paymentSession.unitPrice,
      totalPrice: paymentSession.amount,
      createdAt: new Date().toISOString(),
      medicine: paymentSession.medicine,
      buyer: {
        _id: buyerId,
        fullname: currentUser?.fullname || buyerEmail,
        email: buyerEmail,
      },
      paymentStatus: "PAID",
      paymentMethod: paymentConfig?.provider || "ESEWA",
      transactionId: "FAKE",
    };

    try {
      const key = "medtrack_payment_activity_v1";
      const existing = JSON.parse(localStorage.getItem(key) || "[]") as any[];
      const filtered = existing.filter((x) => x?._id !== fakeActivity._id);
      filtered.unshift(fakeActivity);
      localStorage.setItem(key, JSON.stringify(filtered.slice(0, 20)));
    } catch {
      // If localStorage fails, just proceed with closing the modal.
    }

    setPaymentSession(null);
    setBuyQuantity(1);
    router.push("/dashboard?tab=activity");
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
                <p className="text-sm font-semibold text-black mb-1">Buy this medicine</p>
                {paymentConfig && (
                  <p className="text-xs text-slate-500 mb-3">
                    Pay with {paymentConfig.displayName} (merchant: {paymentConfig.merchantCode})
                  </p>
                )}
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
                    {isBuying ? "Starting checkout…" : "Pay now"}
                  </button>
                </div>
              </div>
            )}

            {paymentSession && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-slate-900">
                    Complete payment
                    {paymentConfig ? ` — ${paymentConfig.displayName}` : ""}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Order ID: <span className="font-mono text-xs">{paymentSession.orderId}</span>
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    Amount: ${paymentSession.amount.toFixed(2)}
                  </p>
                  <div className="mt-4 flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        paymentSession.qrData
                      )}`}
                      alt="Payment QR"
                      className="rounded-xl border border-slate-100"
                    />
                  </div>
                  <a
                    href={paymentSession.qrData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    Open payment page
                  </a>
                  <p className="mt-3 text-xs text-slate-500 text-center">
                    After you pay, this window will update automatically. You can also return from the
                    payment app — keep this page open.
                  </p>
                  <button
                    type="button"
                    onClick={handleFakeConfirm}
                    className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Fake confirm payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentSession(null)}
                    className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
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
