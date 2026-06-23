'use client';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, RefreshCw, DollarSign, ArrowUpRight } from 'lucide-react';
import {
  useGetDashboardStatsQuery,
  useGetDailyRevenueQuery,
  useGetTopProductsQuery,
  useListLowStockQuery,
} from '@/lib/redux/api/adminApi';
import { formatPrice } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STATUS_COLORS = ['#1a3828', '#c47b2a', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const STAT_CARDS = [
  {
    label: 'Revenue (30d)',
    key: 'revenue',
    icon: DollarSign,
    from: '#1a3828',
    to: '#2d5016',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  {
    label: 'Pending Dispatch',
    key: 'pending',
    icon: ShoppingBag,
    from: '#92400e',
    to: '#c47b2a',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  {
    label: 'Customers',
    key: 'customers',
    icon: Users,
    from: '#1e3a8a',
    to: '#2563eb',
    iconBg: 'rgba(255,255,255,0.18)',
  },
  {
    label: 'Active Products',
    key: 'products',
    icon: Package,
    from: '#5b21b6',
    to: '#7c3aed',
    iconBg: 'rgba(255,255,255,0.18)',
  },
];

function ChartTooltip({ active, payload, label, type }: {
  active?: boolean; payload?: { value: number }[]; label?: string; type?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="font-bold text-gray-900 text-sm">
        {type === 'revenue' ? formatPrice(payload[0].value) : `${payload[0].value} orders`}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, refetch, isFetching } = useGetDashboardStatsQuery();
  const { data: rawRevenue = [] }             = useGetDailyRevenueQuery(30);
  const { data: top = [] }                    = useGetTopProductsQuery(6);
  const { data: lowStock = [] }               = useListLowStockQuery({ threshold: 8 });

  const revenue = rawRevenue.map((r) => {
    const d = r as unknown as Record<string, unknown>;
    return {
      date:    (d.date ?? d.revenueDate ?? '') as string,
      revenue: Number(d.revenue ?? d.totalRevenue ?? 0),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  const ordersByStatus = stats ? [
    { name: 'Awaiting Dispatch', value: stats.orders.pending   || 0 },
    { name: 'Dispatched',        value: stats.orders.shipped   || 0 },
    { name: 'Delivered',         value: stats.orders.delivered || 0 },
    { name: 'Other', value: Math.max(0, (stats.orders.total || 0) - (stats.orders.pending || 0) - (stats.orders.shipped || 0) - (stats.orders.delivered || 0)) },
  ].filter((s) => s.value > 0) : [];

  const topRevenue    = top[0]?.totalRevenue ?? 1;
  const avgOrderValue = stats && stats.orders.total > 0 ? stats.revenue30d / stats.orders.total : 0;

  const statValues = stats ? {
    revenue:   { value: formatPrice(stats.revenue30d), sub: `${stats.orders.total} total orders` },
    pending:   { value: String(stats.orders.pending),  sub: 'awaiting shipment' },
    customers: { value: String(stats.users.total),     sub: 'registered accounts' },
    products:  { value: String(stats.products.active), sub: `of ${stats.products.total} total` },
  } : null;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Store performance overview</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Coloured KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, key, icon: Icon, from, to, iconBg }) => {
          const val = statValues?.[key as keyof typeof statValues];
          return (
            <div
              key={key}
              className="rounded-2xl p-5 text-white relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
            >
              {/* decorative circle */}
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <div className="absolute -bottom-6 -right-2 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">{label}</p>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                {val ? (
                  <>
                    <p className="text-2xl font-black text-white leading-none">{val.value}</p>
                    <p className="text-xs text-white/60 mt-1.5">{val.sub}</p>
                  </>
                ) : (
                  <div className="space-y-2 mt-1">
                    <div className="h-7 w-28 rounded-lg bg-white/20 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Secondary metric strip ── */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avg. Order Value', value: formatPrice(avgOrderValue), color: '#1a3828' },
            { label: 'Dispatched',       value: String(stats.orders.shipped ?? 0), color: '#c47b2a' },
            { label: 'Delivered',        value: String(stats.orders.delivered ?? 0), color: '#10b981' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4">
              <div className="h-10 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-black text-gray-900 mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Revenue chart ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-0.5">Earnings</p>
            <p className="text-base font-black text-gray-900">Revenue — Last 30 Days</p>
          </div>
          {revenue.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" /> Live data
            </span>
          )}
        </div>

        {revenue.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#1a3828" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#1a3828" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(d: string) => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip type="revenue" />} />
              <Area type="monotone" dataKey="revenue" stroke="#1a3828" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#1a3828', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 flex flex-col items-center justify-center gap-2">
            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-300 font-medium">No revenue data yet</p>
          </div>
        )}
      </div>

      {/* ── Two-column: Orders by status + Top products ── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Orders donut */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-0.5">Breakdown</p>
            <p className="text-base font-black text-gray-900">Orders by Status</p>
          </div>
          {ordersByStatus.length ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3} dataKey="value">
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7280' }} iconType="circle" iconSize={8} />
                  <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-gray-400 mt-1">{stats?.orders.total ?? 0} total orders</p>
            </>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-300 font-medium">No orders yet</p>
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-earth-600 mb-0.5">Bestsellers</p>
            <p className="text-base font-black text-gray-900">Top Products by Revenue</p>
          </div>
          {top.length ? (
            <div className="space-y-4">
              {top.slice(0, 6).map((p, i) => {
                const rev  = Number(p.totalRevenue ?? (p as unknown as Record<string, unknown>).total_revenue ?? 0);
                const sold = Number(p.totalSold ?? (p as unknown as Record<string, unknown>).total_qty ?? 0);
                const name = (p.productName ?? (p as unknown as Record<string, unknown>).name ?? '') as string;
                const pct  = Number(topRevenue) > 0 ? (rev / Number(topRevenue)) * 100 : 0;
                const barColor = STATUS_COLORS[i % STATUS_COLORS.length];
                return (
                  <div key={p.productId ?? i}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                        style={{ backgroundColor: barColor }}
                      >
                        {i + 1}
                      </span>
                      <p className="flex-1 text-xs font-semibold text-gray-800 truncate">{name}</p>
                      <p className="text-xs font-black text-gray-700">{formatPrice(rev)}</p>
                      <span className="text-[10px] text-gray-400 w-12 text-right">{sold} sold</span>
                    </div>
                    <div className="ml-7 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-300 font-medium">No sales data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Low stock ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Inventory Alert</p>
            <p className="text-base font-black text-gray-900">Low Stock Products</p>
          </div>
        </div>
        {lowStock.length ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {lowStock.map((p) => {
              const critical = p.availableStock <= 2;
              return (
                <div
                  key={p.productId}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: critical ? '#fff1f2' : '#fffbeb',
                    borderColor:     critical ? '#fecdd3' : '#fde68a',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: critical ? '#ef4444' : '#f59e0b' }}
                    />
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.productName}</p>
                  </div>
                  <span
                    className="text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0 ml-3"
                    style={{
                      backgroundColor: critical ? '#ef4444' : '#f59e0b',
                      color: '#fff',
                    }}
                  >
                    {p.availableStock} left
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <ArrowUpRight className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">All products are well-stocked</p>
          </div>
        )}
      </div>

    </div>
  );
}
