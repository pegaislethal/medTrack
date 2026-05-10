"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getPurchaseHistory, type PurchaseHistoryItem } from "@/lib/api/medicine";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Filter, History, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

// We'll extend the type inline to handle our new customer fields
interface SalesItem extends PurchaseHistoryItem {
  customerName?: string;
  customerPhone?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<SalesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const response = await getPurchaseHistory(from, to);
      if (response.success && response.data) {
        setSales(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Error fetching sales history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDateFilter = () => {
    fetchSales(fromDate, toDate);
    setShowDateFilter(false);
  };

  const handleClearDateFilter = () => {
    setFromDate("");
    setToDate("");
    fetchSales();
  };

  const filteredSales = useMemo(() => {
    if (!search) return sales;
    const lowerSearch = search.toLowerCase();
    
    return sales.filter((sale) => {
      const medicineMatch = sale.medicine?.medicineName?.toLowerCase().includes(lowerSearch);
      const buyerMatch = sale.customerName?.toLowerCase().includes(lowerSearch) || sale.buyer?.fullname?.toLowerCase().includes(lowerSearch);
      return medicineMatch || buyerMatch;
    });
  }, [sales, search]);

  const isFilterActive = fromDate || toDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-sm text-slate-500 mt-1">Review past transactions and buyer details.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-sm">
            <Input 
              isSearch 
              placeholder="Search by customer or medicine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="gap-2 shrink-0"
            onClick={() => setShowDateFilter(!showDateFilter)}
          >
            <Filter className="w-4 h-4" />
            Filter by Date {isFilterActive && <span className="ml-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Active</span>}
          </Button>
        </div>

        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900">Filter by Date Range</h3>
              <button 
                onClick={() => setShowDateFilter(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-slate-900 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-900 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex gap-2 sm:justify-end pt-2">
              {isFilterActive && (
                <Button 
                  variant="outline"
                  onClick={handleClearDateFilter}
                  className="text-red-600 hover:bg-red-50 border-red-200"
                >
                  Clear Filter
                </Button>
              )}
              <Button 
                onClick={handleApplyDateFilter}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Apply Filter
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Medicine</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead className="text-right">Total Price</TableHead>
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
            ) : filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500 text-sm">
                  No sales found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell className="text-sm text-slate-600">
                    {new Date(sale.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">
                      {sale.customerName || sale.buyer?.fullname || "Walk-in Customer"}
                    </div>
                    {sale.customerPhone && (
                      <div className="text-xs text-slate-500">{sale.customerPhone}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{sale.medicine?.medicineName || "Unknown"}</div>
                    <div className="text-xs text-slate-500">Batch: {sale.medicine?.batchNumber || "N/A"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{sale.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    Rs {sale.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-indigo-700">
                    Rs {sale.totalPrice.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
