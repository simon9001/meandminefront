'use client';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle } from 'lucide-react';
import {
  useGetDashboardStatsQuery,
  useGetDailyRevenueQuery,
  useGetTopProductsQuery,
  useListLowStockQuery,
} from '@/lib/redux/api/adminApi';
import { formatPrice } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

function StatCard({
  label, value, icon: Icon, change, color,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  change?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      {change && <p className="text-xs text-green-600 font-medium">{change}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats }    = useGetDashboardStatsQuery();
  const { data: revenue = [] } = useGetDailyRevenueQuery(30);
  const { data: top = [] }     = useGetTopProductsQuery(5);
  const { data: lowStock = [] } = useListLowStockQuery({ threshold: 5 });

  const statCards = stats ? [
    { label: 'Revenue (30d)',   value: formatPrice(stats.revenue30d),    icon: TrendingUp,  color: 'bg-forest-50 text-forest-600',  change: `${stats.orders.total} orders total` },
    { label: 'Pending Orders', value: String(stats.orders.pending),     icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Customers',      value: String(stats.users.total),        icon: Users,       color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Products', value: String(stats.products.active),   icon: Package,     color: 'bg-amber-50 text-amber-600' },
  ] : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.length
          ? statCards.map((c) => <StatCard key={c.label} {...c} />)
          : [1, 2, 3, 4].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)
        }
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-5">Revenue (Last 30 Days)</h2>
        {revenue.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2d7350" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2d7350" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0faf5" />
              <XAxis dataKey="revenueDate" tick={{ fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [formatPrice(Number(v)), 'Revenue']}
                labelFormatter={(l) => `Date: ${String(l)}`}
              />
              <Area type="monotone" dataKey="totalRevenue" stroke="#2d7350" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
            No revenue data yet
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Top Products</h2>
          {top.length ? (
            <div className="space-y-3">
              {top.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-bold text-gray-400">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.productName}</p>
                    <p className="text-xs text-gray-500">{p.totalSold} sold</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatPrice(p.totalRevenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No sales data yet</p>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Low Stock Alerts
          </h2>
          {lowStock.length ? (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate flex-1">{p.productName}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    p.availableStock <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.availableStock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-green-600 font-medium">✓ All products well-stocked</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
