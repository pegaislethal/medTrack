"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllMedicines, deleteMedicine, type Medicine } from "@/lib/api/medicine";
import { isAuthenticated, getUser } from "@/lib/utils/token";

export default function MedicinesPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const userData = getUser();
    setUser(userData);
    fetchMedicines();
  }, [router]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await getAllMedicines();
      if (response.success && response.data) {
        setMedicines(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || "Failed to fetch medicines");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load medicines");
      if (err.statusCode === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicineId: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) {
      return;
    }

    try {
      setDeletingId(medicineId);
      const response = await deleteMedicine(medicineId);
      if (response.success) {
        setMedicines(medicines.filter((med) => med._id !== medicineId));
      } else {
        alert(response.message || "Failed to delete medicine");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete medicine");
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = user && user.role === "admin";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Loading medicines...</p>
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
                Medicines
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Browse and manage medicines
              </p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/medicines/add"
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Add Medicine
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Back to Dashboard
              </Link>
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

        {medicines.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">No medicines found</p>
            {isAdmin && (
              <Link
                href="/medicines/add"
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Add First Medicine
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((medicine) => (
              <div
                key={medicine._id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
              >
                {medicine.image?.url && (
                  <div className="aspect-video bg-slate-100">
                    <img
                      src={medicine.image.url}
                      alt={medicine.medicineName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {medicine.medicineName}
                    </h3>
                    {isExpired(medicine.expiryDate) && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    {medicine.description || "No description"}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Category:</span>
                      <span className="font-medium text-slate-900">
                        {medicine.category}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Manufacturer:</span>
                      <span className="font-medium text-slate-900">
                        {medicine.manufacturer}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Batch Number:</span>
                      <span className="font-medium text-slate-900">
                        {medicine.batchNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Quantity:</span>
                      <span className="font-medium text-slate-900">
                        {medicine.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Price:</span>
                      <span className="font-medium text-slate-900">
                        ${medicine.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Expiry Date:</span>
                      <span
                        className={`font-medium ${
                          isExpired(medicine.expiryDate)
                            ? "text-red-600"
                            : "text-slate-900"
                        }`}
                      >
                        {formatDate(medicine.expiryDate)}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleDelete(medicine._id)}
                        disabled={deletingId === medicine._id}
                        className="flex-1 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === medicine._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

