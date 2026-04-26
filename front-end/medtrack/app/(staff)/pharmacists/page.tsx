"use client";

import React, { useState, useEffect } from "react";
import { getAllPharmacists, deletePharmacist, createPharmacist, updatePharmacist } from "@/lib/api/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Shield, User, Edit2 } from "lucide-react";

export default function PharmacistsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await getAllPharmacists();
      if (response.success && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      console.error(err);
      if (err.statusCode === 403 || err.message?.includes("Admin not found") || err.message?.includes("Access denied")) {
        setApiError("Access Denied: You must be an Administrator to manage staff members.");
      } else {
        setApiError(err.message || "Failed to load staff members.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      await deletePharmacist(id);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to delete user: " + err.message);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({ fullname: "", email: "", password: "" });
    setGeneratedPassword(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setIsEditMode(true);
    setCurrentId(user._id || user.id);
    setFormData({ fullname: user.fullname || "", email: user.email || "", password: "" });
    setGeneratedPassword(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && currentId) {
        // Send password only if explicitly trying to change it
        const payload: any = { fullname: formData.fullname, email: formData.email };
        if (formData.password.trim()) payload.password = formData.password;
        await updatePharmacist(currentId, payload);
        setIsModalOpen(false);
      } else {
        const response = await createPharmacist(formData);
        if (response.data && response.data.tempPassword) {
          setGeneratedPassword(response.data.tempPassword);
        } else {
          setIsModalOpen(false);
        }
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to save pharmacist.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pharmacists</h1>
          <p className="text-sm text-slate-500 mt-1">Manage staff access and pharmacy roles.</p>
        </div>
        {!apiError && (
          <Button onClick={openAddModal} className="shrink-0 gap-2">
            <Plus className="w-4 h-4" />
            Add Staff
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                  <div className="animate-pulse flex items-center justify-center gap-2">
                     <span className="w-4 h-4 rounded-full bg-slate-200"></span>
                     <span className="w-4 h-4 rounded-full bg-slate-200"></span>
                     <span className="w-4 h-4 rounded-full bg-slate-200"></span>
                  </div>
                </TableCell>
              </TableRow>
            ) : apiError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-red-600">
                    <Shield className="w-8 h-8 opacity-50" />
                    <p className="font-medium">{apiError}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-slate-500 text-sm">
                  No staff members found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id || user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <User className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-slate-900">{user.fullname || "Anonymous"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "warning" : "info"} className="gap-1.5 capitalize">
                      {user.role === "admin" && <Shield className="w-3 h-3" />}
                      {user.role || "Pharmacist"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 mr-2" onClick={() => openEditModal(user)}>
                      <Edit2 className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user._id || user.id)}>
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
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
        title={isEditMode ? "Edit Pharmacist" : "Add Pharmacist"}
      >
        {generatedPassword ? (
          <div className="space-y-4 py-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm">
              Pharmacist account created successfully! Please copy the temporary password below and share it securely with the user.
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Temporary Password</label>
              <div className="flex gap-2">
                <Input readOnly value={generatedPassword} className="font-mono bg-slate-50 text-slate-600" />
                <Button type="button" onClick={() => navigator.clipboard.writeText(generatedPassword)}>Copy</Button>
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsModalOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <Input required value={formData.fullname} onChange={e => setFormData({...formData, fullname: e.target.value})} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@medtrack.local" />
            </div>
            {isEditMode && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Change Password (optional)</label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>
            )}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? "Save Changes" : "Create Pharmacist"}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
