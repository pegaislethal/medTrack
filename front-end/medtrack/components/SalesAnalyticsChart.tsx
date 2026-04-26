"use client";

import React, { useState, useMemo } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Calendar } from "lucide-react";
import { PurchaseHistoryItem } from "@/lib/api/medicine";

interface SalesAnalyticsChartProps {
  history: PurchaseHistoryItem[];
}

interface DailyDataPoint {
  name: string;
  sales: number;
  hour: number;
  timestamp: number;
  day: number;
  peak?: boolean;
}

interface WeeklyDataPoint {
  name: string;
  sales: number;
  dateStr: string;
  peak?: boolean;
}

interface MonthlyDataPoint {
  name: string;
  sales: number;
  month: number;
  year: number;
  peak?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-w-[140px]">
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-xl font-bold text-indigo-600">
          Rs {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload && payload.peak) {
    return (
      <circle cx={cx} cy={cy} r={6} stroke="#ffffff" strokeWidth={3} fill="#4f46e5" />
    );
  }
  return null;
};

export default function SalesAnalyticsChart({ history }: SalesAnalyticsChartProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  const chartData = useMemo<(DailyDataPoint | WeeklyDataPoint | MonthlyDataPoint)[]>(() => {
    if (!history || !Array.isArray(history)) return [];

    const now = new Date();
    
    if (timeframe === "daily") {
      const hours: DailyDataPoint[] = [];
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const h = d.getHours();
        hours.push({
          name: `${String(h).padStart(2, '0')}:00`,
          sales: 0,
          hour: h,
          timestamp: d.getTime(),
          day: d.getDate()
        });
      }

      history.forEach(item => {
        const itemDate = new Date(item.createdAt);
        const itemHour = itemDate.getHours();
        const itemDay = itemDate.getDate();
        const target = hours.find(h => h.hour === itemHour && h.day === itemDay);
        if (target) target.sales += item.totalPrice;
      });

      const maxSales = Math.max(...hours.map(h => h.sales));
      return hours.map(h => ({ ...h, peak: h.sales > 0 && h.sales === maxSales }));
    }

    if (timeframe === "weekly") {
      const days: WeeklyDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push({
          name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: 0,
          dateStr: d.toDateString()
        });
      }

      history.forEach(item => {
        const itemDate = new Date(item.createdAt);
        const dateStr = itemDate.toDateString();
        const target = days.find(d => d.dateStr === dateStr);
        if (target) target.sales += item.totalPrice;
      });

      const maxSales = Math.max(...days.map(d => d.sales));
      return days.map(d => ({ ...d, peak: d.sales > 0 && d.sales === maxSales }));
    }

    if (timeframe === "monthly") {
      const months: MonthlyDataPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: d.toLocaleString('default', { month: 'long' }),
          sales: 0,
          month: d.getMonth(),
          year: d.getFullYear()
        });
      }

      history.forEach(item => {
        const itemDate = new Date(item.createdAt);
        const m = itemDate.getMonth();
        const y = itemDate.getFullYear();
        const target = months.find(mo => mo.month === m && mo.year === y);
        if (target) target.sales += item.totalPrice;
      });

      const maxSales = Math.max(...months.map(m => m.sales));
      return months.map(m => ({ ...m, peak: m.sales > 0 && m.sales === maxSales }));
    }

    return [];
  }, [history, timeframe]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full h-[400px] flex flex-col items-center justify-center text-slate-500">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-700">No Sales Data Available</p>
        <p className="text-sm text-slate-400 mt-1">Analytics will appear here once purchases are made.</p>
      </div>
    );
  }

  // Calculate dynamic width to prevent "glitchy" compression
  const dynamicMinWidth = timeframe === "daily" ? 1000 : timeframe === "monthly" ? 1200 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sales Trends</h2>
          <p className="text-sm text-slate-500 font-medium">
            {timeframe === "daily" && "Last 24 Hours Performance"}
            {timeframe === "weekly" && "Revenue trend for the past 7 days"}
            {timeframe === "monthly" && "Monthly growth & revenue overview"}
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 shadow-inner">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                timeframe === t
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-200/50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={`w-full overflow-x-auto custom-scrollbar pb-4`}>
        <div style={{ minWidth: dynamicMinWidth ? `${dynamicMinWidth}px` : '100%' }} className="h-[340px] relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>

            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                type="category"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }} 
                dy={15}
                interval={timeframe === "daily" ? 1 : 0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: '600' }}
                tickFormatter={(value) => value >= 1000 ? `Rs ${value / 1000}k` : `Rs ${value}`}
                dx={-8}
                width={65}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#4f46e5', strokeWidth: 1.5, strokeDasharray: '5 5', opacity: 0.5 }} 
              />
              <Area
                key={timeframe}
                type="monotone"
                dataKey="sales"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
                activeDot={<CustomizedDot />}
                dot={<CustomizedDot />}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

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
