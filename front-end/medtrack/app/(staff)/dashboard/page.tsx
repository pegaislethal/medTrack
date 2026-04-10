"use client";

import React, { useEffect, useState } from "react";
import { getRecentActivities } from "@/lib/api/admin";
import { getAllMedicines, type Medicine } from "@/lib/api/medicine";
import { Pill, AlertTriangle, PackageOpen, TrendingUp, History, UserPlus, ShoppingCart } from "lucide-react";
import { getUser } from "@/lib/utils/token";

interface Activity {
  _id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user && user.role === 'admin') {
      setIsAdmin(true);
      fetchActivities();
    }
    fetchMedicines();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await getRecentActivities();
      if (response.success && response.data) {
        setActivities(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMedicines = async () => {
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

  const getStats = () => {
    const now = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(now.getDate() + 30);

    const available = medicines.length; // Total medicine variations
    
    // Low stock is <= 60 units
    const lowStock = medicines.filter(m => m.quantity <= 60).length;
    
    const expiringSoon = medicines.filter(m => {
      const expiryDate = new Date(m.expiryDate);
      return expiryDate > now && expiryDate <= thirtyDays;
    }).length;

    return { available, lowStock, expiringSoon };
  };

  const stats = getStats();
  
  // Get recent alerts (mix of low stock and expiring soon for preview)
  const recentAlerts = medicines
    .filter(m => {
      const isLowStock = m.quantity <= 60;
      const isExpiring = new Date(m.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return isLowStock || isExpiring;
    })
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5); // Limit to 5

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your pharmacy inventory and alerts.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Medicines</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.available}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <PackageOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Low Stock</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.lowStock}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Expiring Soon</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.expiringSoon}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900">Recent Alerts</h2>
          </div>
          <div className="p-6">
            {recentAlerts.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">No active alerts at the moment.</p>
            ) : (
              <div className="space-y-4">
                {recentAlerts.map(med => {
                  const isLowStock = med.quantity <= 60;
                  const isExpiring = new Date(med.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <div key={med._id} className={`flex items-start gap-4 p-4 rounded-xl border ${isLowStock ? 'bg-red-50/30 border-red-100' : 'bg-amber-50/30 border-amber-100'}`}>
                      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {med.medicineName} <span className="text-xs font-normal text-slate-500">({med.batchNumber})</span>
                        </p>
                        <p className={`text-xs mt-1 font-medium ${isLowStock ? 'text-red-700' : 'text-amber-700'}`}>
                          {isLowStock && `Low stock: ${med.quantity} remaining. `}
                          {isExpiring && `Expiring: ${new Date(med.expiryDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hidden lg:flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <History className="w-5 h-5 text-slate-400" />
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 py-8">
                  No recent activities recorded.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map((activity) => (
                    <div key={activity._id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`mt-0 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === 'SALE' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {activity.type === 'SALE' ? (
                          <ShoppingCart className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 leading-snug">
                          {activity.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hidden lg:block">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">System Status</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-medium text-slate-600">Online</span>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center justify-center h-full text-center pb-12">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                 <TrendingUp className="w-8 h-8" />
               </div>
               <h3 className="text-lg font-medium text-slate-900">All Systems Operational</h3>
               <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                 Your MedTrack inventory and billing systems are running smoothly.
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
