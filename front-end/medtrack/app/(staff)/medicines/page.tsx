"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllMedicines, createMedicine, updateMedicine, deleteMedicine, type Medicine } from "@/lib/api/medicine";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Plus, Edit2, Trash2, Filter, AlertTriangle } from "lucide-react";

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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  <div className="animate-pulse flex items-center justify-center gap-2">
                     <span className="w-4 h-4 rounded-full bg-slate-200"></span>
                     <span className="w-4 h-4 rounded-full bg-slate-200"></span>
                     <span className="w-4 h-4 rounded-full bg-slate-200"></span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMedicines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500 text-sm">
                  No medicines found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMedicines.map((med) => (
                <TableRow key={med._id}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{med.medicineName}</div>
                    <div className="text-xs text-slate-500">Batch: {med.batchNumber}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{med.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {med.quantity <= 60 ? (
                      <Badge variant="danger" className="gap-1.5 font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {med.quantity}
                      </Badge>
                    ) : (
                      <Badge variant="success" className="font-medium">
                        {med.quantity}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isExpiringSoon(med.expiryDate) ? (
                      <Badge variant="warning" className="gap-1.5 font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {new Date(med.expiryDate).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <span className="text-sm text-slate-600">{new Date(med.expiryDate).toLocaleDateString()}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-900">
                    Rs {med.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenEditModal(med)}>
                        <Edit2 className="w-4 h-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(med._id)}>
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
