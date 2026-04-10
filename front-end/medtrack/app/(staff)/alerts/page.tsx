"use client";

import React, { useState, useEffect } from "react";
import { getAllMedicines, type Medicine } from "@/lib/api/medicine";
import { AlertCircle, AlertTriangle, PackageOpen, Hourglass } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function AlertsPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getAlerts = () => {
    const alerts: any[] = [];
    const now = new Date();
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    medicines.forEach((med) => {
      // Out of stock
      if (med.quantity <= 0) {
        alerts.push({
          id: `${med._id}-oos`,
          type: "critical_stock",
          medicine: med,
          message: "Out of stock completely. Immediate restock required.",
          date: new Date().toISOString()
        });
      } 
      // Low stock
      else if (med.quantity <= 60) {
        alerts.push({
          id: `${med._id}-ls`,
          type: "low_stock",
          medicine: med,
          message: `Stock running low: ${med.quantity} remaining.`,
          date: new Date().toISOString()
        });
      }

      // Expired
      const expiry = new Date(med.expiryDate);
      if (expiry < now) {
        alerts.push({
          id: `${med._id}-exp`,
          type: "expired",
          medicine: med,
          message: `Expired on ${expiry.toLocaleDateString()}. Dispose immediately.`,
          date: med.expiryDate
        });
      } 
      // Expiring soon
      else if (expiry <= thirtyDays) {
        alerts.push({
          id: `${med._id}-es`,
          type: "expiring",
          medicine: med,
          message: `Expiring soon on ${expiry.toLocaleDateString()}.`,
          date: med.expiryDate
        });
      }
    });

    return alerts.sort((a, b) => {
      // Prioritize critical stock and expired items
      const aPriority = (a.type === 'critical_stock' || a.type === 'expired') ? 1 : 0;
      const bPriority = (b.type === 'critical_stock' || b.type === 'expired') ? 1 : 0;
      return bPriority - aPriority;
    });
  };

  const alerts = getAlerts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Alerts</h1>
        <p className="text-sm text-slate-500 mt-1">Review items requiring your immediate attention.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Action Required</h2>
          </div>
          <Badge variant="neutral" className="px-3">
             {alerts.length} Alerts
          </Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">All clear</h3>
            <p className="text-slate-500 mt-1 text-sm max-w-sm">No critical stock warnings or expiring medicines at this time.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => {
              const isStock = alert.type === 'low_stock' || alert.type === 'critical_stock';
              const isCritical = alert.type === 'critical_stock' || alert.type === 'expired';
              
              const Icon = isStock ? PackageOpen : Hourglass;

              return (
                <div key={alert.id} className={`p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${isCritical ? 'bg-red-50/10' : ''}`}>
                  <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                    isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-900 line-clamp-1">
                          {alert.medicine.medicineName} <span className="font-normal text-slate-500">({alert.medicine.batchNumber})</span>
                        </h4>
                        <p className={`text-sm mt-1 font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                          {alert.message}
                        </p>
                      </div>
                      <Badge variant={isCritical ? "danger" : "warning"} className="shrink-0">
                        {alert.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
