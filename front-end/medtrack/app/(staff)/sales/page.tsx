"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getPurchaseHistory, type PurchaseHistoryItem } from "@/lib/api/medicine";
import { Input } from "@/components/ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Filter, History, Search } from "lucide-react";
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

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await getPurchaseHistory();
      if (response.success && response.data) {
        setSales(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error("Error fetching sales history", err);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
          <p className="text-sm text-slate-500 mt-1">Review past transactions and buyer details.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-sm">
          <Input 
            isSearch 
            placeholder="Search by customer or medicine..."
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
