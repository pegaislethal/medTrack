"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createMedicine } from "@/lib/api/medicine";
import { isAuthenticated, getUser } from "@/lib/utils/token";

export default function AddMedicinePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    medicineName: "",
    batchNumber: "",
    category: "",
    manufacturer: "",
    quantity: "",
    price: "",
    expiryDate: "",
    description: "",
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const userData = getUser();
    setUser(userData);
    if (!userData || userData.role !== "admin") {
      router.push("/medicines");
      return;
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!form.medicineName || !form.batchNumber || !form.category || 
        !form.manufacturer || !form.quantity || !form.price || !form.expiryDate) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseInt(form.quantity) < 0) {
      setError("Quantity must be 0 or greater");
      return;
    }

    if (parseFloat(form.price) < 0) {
      setError("Price must be 0 or greater");
      return;
    }

    setLoading(true);

    try {
      const response = await createMedicine({
        medicineName: form.medicineName,
        batchNumber: form.batchNumber,
        category: form.category,
        manufacturer: form.manufacturer,
        quantity: parseInt(form.quantity),
        price: parseFloat(form.price),
        expiryDate: form.expiryDate,
        description: form.description,
        image: image || undefined,
      });

      if (response.success) {
        setSuccess("Medicine added successfully! Redirecting...");
        setTimeout(() => {
          router.push("/medicines");
        }, 1500);
      } else {
        setError(response.message || "Failed to add medicine");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add medicine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Add Medicine
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Add a new medicine to the inventory
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/medicines"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Back to Medicines
                </Link>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="medicineName"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="medicineName"
                  name="medicineName"
                  type="text"
                  required
                  value={form.medicineName}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="Enter medicine name"
                />
              </div>

              <div>
                <label
                  htmlFor="batchNumber"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Batch Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="batchNumber"
                  name="batchNumber"
                  type="text"
                  required
                  value={form.batchNumber}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="Enter batch number"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  id="category"
                  name="category"
                  type="text"
                  required
                  value={form.category}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="e.g., Antibiotic, Painkiller"
                />
              </div>

              <div>
                <label
                  htmlFor="manufacturer"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Manufacturer <span className="text-red-500">*</span>
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  required
                  value={form.manufacturer}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="Enter manufacturer name"
                />
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  required
                  min="0"
                  value={form.quantity}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="0"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                  value={form.expiryDate}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-slate-800 mb-2"
                >
                  Medicine Image
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-800 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                placeholder="Enter medicine description"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding Medicine..." : "Add Medicine"}
              </button>
              <Link
                href="/medicines"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

