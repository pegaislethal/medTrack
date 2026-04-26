"use client";

import React, { useEffect, useState } from "react";
import { getRecentActivities } from "@/lib/api/admin";
import { getAllMedicines, type Medicine, getPurchaseHistory, getPurchaseAnalytics, type PurchaseHistoryItem, type PurchaseAnalytics } from "@/lib/api/medicine";
import { Pill, AlertTriangle, PackageOpen, TrendingUp, History, UserPlus, ShoppingCart, Calendar, Download, TrendingDown, RefreshCcw } from "lucide-react";

import { getUser } from "@/lib/utils/token";
import SalesAnalyticsChart from "@/components/SalesAnalyticsChart";
import TopMedicinesChart from "@/components/TopMedicinesChart";


interface Activity {
  _id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function Dashboard() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<PurchaseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);


  useEffect(() => {
    const user = getUser();
    if (user && user.role === 'admin') {
      setIsAdmin(true);
    }
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMedicines(),
        fetchPurchaseHistory(),
        fetchPurchaseAnalytics(),
        fetchActivities()
      ]);

    } catch (err: any) {
      setError("Failed to load dashboard data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


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
    const response = await getAllMedicines();
    if (response.success && response.data) {
      setMedicines(Array.isArray(response.data) ? response.data : []);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      const response = await getPurchaseHistory();
      if (response.success && response.data) {
        setPurchaseHistory(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch purchase history:", err);
    }
  };

  const fetchPurchaseAnalytics = async () => {
    try {
      const response = await getPurchaseAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch purchase analytics:", err);
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

    return { 
      available, 
      lowStock, 
      expiringSoon,
      totalRevenue: analytics?.totalRevenue || 0,
      totalItemsSold: analytics?.totalItemsSold || 0,
      totalOrders: analytics?.totalOrders || 0
    };
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
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-10 w-64 bg-slate-200 rounded-xl mb-2"></div>
            <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 bg-slate-100 rounded-xl mb-4"></div>
              <div className="h-6 w-16 bg-slate-100 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm"></div>
        <div className="h-[400px] bg-white border border-slate-100 rounded-2xl shadow-sm"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="bg-red-50 p-4 rounded-full text-red-600">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">Dashboard Error</h3>
          <p className="text-slate-500 max-w-xs mx-auto">{error}</p>
        </div>
        <button 
          onClick={fetchAllData}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{isAdmin ? "Admin Dashboard" : "Pharmacy Dashboard"}</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of your pharmacy operations and sales trends.</p>
        </div>

        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAllData}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all mr-2"
            title="Refresh Data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-indigo-100 transition-all active:scale-95">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Medicines</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{stats.available}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> 12%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
              <PackageOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Low Stock</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{stats.lowStock}</p>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">Critical</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expiring</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{stats.expiringSoon}</p>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Soon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">Rs {stats.totalRevenue.toLocaleString()}</p>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> 8%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Units Sold</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{stats.totalItemsSold}</p>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">Growth</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:scale-[1.02] hover:shadow-md transition-all duration-300">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-100 transition-colors">
              <PackageOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Orders</p>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle section: Sales Analytics */}
      <div className="w-full">
        <SalesAnalyticsChart history={purchaseHistory} />
      </div>

      {/* Bottom section: Top Selling Medicines */}
      <div className="w-full">
        <TopMedicinesChart 
          data={analytics?.topMedicines?.map(m => ({
            name: m.medicineName,
            sold: m.totalSold
          })) || []} 
        />
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hidden lg:flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
            <History className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
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
      </div>

    </div>
  );
}
