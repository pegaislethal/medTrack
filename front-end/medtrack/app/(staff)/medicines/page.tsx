"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllMedicines, createMedicine, updateMedicine, deleteMedicine, type Medicine } from "@/lib/api/medicine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit2, Trash2, Filter, AlertTriangle, Package, Calendar } from "lucide-react";

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    medicineName: "",
    batchNumber: "",
    category: "",
    manufacturer: "",
    quantity: 0,
    price: 0,
    expiryDate: "",
    description: "",
    image: undefined as File | undefined,
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await getAllMedicines();
      if (response.success && response.data) {
        setMedicines(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = useMemo(() => {
    if (!search) return medicines;
    const lowerSearch = search.toLowerCase();
    return medicines.filter((m) => 
      m.medicineName.toLowerCase().includes(lowerSearch) ||
      m.category.toLowerCase().includes(lowerSearch) ||
      m.batchNumber.toLowerCase().includes(lowerSearch)
    );
  }, [medicines, search]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedMedId(null);
    setFormData({
      medicineName: "", batchNumber: "", category: "", 
      manufacturer: "", quantity: 0, price: 0, 
      expiryDate: "", description: "", image: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (med: Medicine) => {
    setIsEditMode(true);
    setSelectedMedId(med._id);
    setFormData({
      medicineName: med.medicineName,
      batchNumber: med.batchNumber,
      category: med.category,
      manufacturer: med.manufacturer,
      quantity: med.quantity,
      price: med.price,
      expiryDate: med.expiryDate.split('T')[0], // format for input type="date"
      description: med.description || "",
      image: undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await deleteMedicine(id);
      await fetchMedicines();
    } catch (err) {
      console.error(err);
      alert("Failed to delete medicine.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In production, we would handle File uploads too, but this hits the basic requirements.
      if (isEditMode && selectedMedId) {
        await updateMedicine(selectedMedId, formData);
      } else {
        await createMedicine(formData as any);
      }
      setIsModalOpen(false);
      fetchMedicines();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save medicine");
    }
  };

  const isExpiringSoon = (date: string) => {
    return new Date(date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicines</h1>
          <p className="text-sm text-slate-500 mt-1">Manage inventory, stock levels, and expiry dates.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="shrink-0 gap-2">
          <Plus className="w-4 h-4" />
          Add Medicine
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm">
          <Input 
            isSearch 
            placeholder="Search by name, category, batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 w-full bg-white rounded-2xl border border-slate-200">
          <div className="animate-pulse flex items-center justify-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-200"></span>
            <span className="w-4 h-4 rounded-full bg-slate-200"></span>
            <span className="w-4 h-4 rounded-full bg-slate-200"></span>
          </div>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="flex items-center justify-center h-48 w-full bg-white rounded-2xl border border-slate-200 text-slate-500">
          No medicines found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMedicines.map((med) => (
            <div key={med._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col overflow-hidden">
              {med.image?.url ? (
                <div className="h-40 w-full bg-slate-100 flex items-center justify-center shrink-0 border-b border-slate-100">
                  <img src={med.image.url} alt={med.medicineName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 w-full bg-slate-50 flex items-center justify-center shrink-0 text-slate-300 border-b border-slate-100">
                  <Package className="w-10 h-10 opacity-40" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{med.medicineName}</h3>
                  <div className="text-slate-500 text-xs mt-0.5 font-medium">Batch: {med.batchNumber}</div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge variant="neutral">{med.category}</Badge>
                  {isExpiringSoon(med.expiryDate) && (
                    <Badge variant="warning" className="gap-1 font-bold text-[10px] px-1.5 py-0">
                      <AlertTriangle className="w-3 h-3" />
                      Expiring
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                    <Package className="w-3 h-3" />
                    Stock
                  </div>
                  {med.quantity <= 60 ? (
                    <span className="text-red-600 font-bold flex items-center gap-1.5 text-sm">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {med.quantity} Units
                    </span>
                  ) : (
                    <span className="text-slate-900 font-bold text-sm">
                      {med.quantity} Units
                    </span>
                  )}
                </div>
                
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase">
                    <Calendar className="w-3 h-3" />
                    Expiry
                  </div>
                  <span className={`font-bold text-sm ${isExpiringSoon(med.expiryDate) ? 'text-amber-600' : 'text-slate-900'}`}>
                    {new Date(med.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <div className="text-lg font-black text-indigo-700">
                  Rs {med.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-transparent bg-white" onClick={() => handleOpenEditModal(med)}>
                    <Edit2 className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-transparent bg-white" onClick={() => handleDelete(med._id)}>
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={isEditMode ? "Edit Medicine" : "Add Medicine"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Medicine Name</label>
              <Input required value={formData.medicineName} onChange={e => setFormData({...formData, medicineName: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Batch Number</label>
              <Input required value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Manufacturer</label>
              <Input required value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Quantity</label>
              <Input required type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Price (Rs)</label>
              <Input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Expiry Date</label>
              <Input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
            <textarea 
              className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors shadow-sm min-h-[80px]"
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Medicine Image <span className="text-slate-400 font-normal">(Optional)</span></label>
            <Input 
              type="file" 
              accept="image/*"
              className="pt-1.5"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setFormData({...formData, image: e.target.files[0]});
                }
              }} 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{isEditMode ? "Save Changes" : "Add Medicine"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
