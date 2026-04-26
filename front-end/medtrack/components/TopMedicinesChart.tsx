"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { TrendingUp, PackageSearch } from "lucide-react";

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-800 min-w-[140px]">
        <p className="text-sm font-medium text-slate-300 mb-1">{label}</p>
        <p className="text-lg font-bold text-white flex items-center gap-2">
          {payload[0].value} <span className="text-xs font-normal text-slate-400">units sold</span>
        </p>
      </div>
    );
  }
  return null;
};

interface TopMedicinesChartProps {
  data: { name: string; sold: number }[];
}

export default function TopMedicinesChart({ data }: TopMedicinesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full h-[360px] flex flex-col items-center justify-center text-slate-500">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <PackageSearch className="w-8 h-8 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-700">No Sales Data</p>
        <p className="text-sm text-slate-400 mt-1 text-center max-w-[200px]">Top selling medicines will appear here once orders are placed.</p>
      </div>
    );
  }

  // Calculate dynamic width to prevent "glitchy" compression
  const dynamicMinWidth = Math.max(500, data.length * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full flex flex-col h-[420px]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Most Sold Medicines
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </h2>
          <p className="text-sm text-slate-500">Based on total quantity sold from all orders</p>
        </div>
      </div>

      <div className="flex-1 w-full overflow-x-auto custom-scrollbar pb-2">
        <div style={{ minWidth: `${dynamicMinWidth}px` }} className="h-full relative min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>

            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }}
                dx={-8}
                width={45}
              />
              <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
              <Bar dataKey="sold" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Adding styles for the custom scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
