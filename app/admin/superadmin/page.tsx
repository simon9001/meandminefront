'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  TrendingUp, Users, ShoppingBag, DollarSign, Loader2,
  ArrowUpRight, CreditCard, Smartphone, ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useGetSuperAdminAnalyticsQuery } from '@/lib/redux/api/adminApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { formatPrice } from '@/lib/utils';

const PALETTE = ['#7c3aed', '#2563eb', '#1a3828', '#c47b2a', '#10b981', '#ef4444', '#f59e0b', '#06b6d4'];

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label, fmt }: {
  active?: boolean; payload?: { value: number; name?: string }[];
  label?: string; fmt?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-4 py-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold text-gray-900">
          {p.name ? `${p.name}: ` : ''}{fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function SuperAdminPage() {
  const user   = useAppSelector(selectCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'superadmin') router.replace('/admin');
  }, [user, router]);

  const { data, isLoading } = useGetSuperAdminAnalyticsQuery();

  if (!user || user.role !== 'superadmin') return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data) return null;

  const { revenue, orders, users, paymentMethods, revenueByCategory, topCustomers, dailyRevenue, weeklyNewUsers } = data;

  const avgOrder = orders.paid > 0 ? revenue.last30d / orders.paid : 0;

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Deep Analytics</h1>
          <p className="text-xs text-purple-500 font-semibold">Super Admin View — full site intelligence</p>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Revenue</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="All Time"  value={formatPrice(revenue.allTime)}  icon={DollarSign} color="#7c3aed" />
          <StatCard label="Last 90d"  value={formatPrice(revenue.last90d)}  icon={TrendingUp} color="#2563eb" />
          <StatCard label="Last 30d"  value={formatPrice(revenue.last30d)}  sub={`Avg order ${formatPrice(avgOrder)}`} icon={ArrowUpRight} color="#1a3828" />
          <StatCard label="Last 7d"   value={formatPrice(revenue.last7d)}   icon={TrendingUp} color="#10b981" />
        </div>
      </div>

      {/* Orders + Users KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders"   value={String(orders.total)}            sub={`${orders.conversionRate}% conversion`} icon={ShoppingBag} color="#c47b2a" />
        <StatCard label="Paid Orders"    value={String(orders.paid)}             sub={`${orders.failedPayments} failed`}       icon={ArrowUpRight} color="#10b981" />
        <StatCard label="Total Users"    value={String(users.total)}             sub={`+${users.newLast7d} this week`}         icon={Users}       color="#7c3aed" />
        <StatCard label="New (30d)"      value={String(users.newLast30d)}        sub={`+${users.newLast7d} last 7 days`}       icon={Users}       color="#2563eb" />
      </div>

      {/* 90-day revenue chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">Earnings Trend</p>
        <p className="text-base font-black text-gray-900 mb-5">Daily Revenue — Last 90 Days</p>
        {dailyRevenue.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(d: string) => d.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip fmt={formatPrice} />} />
              <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#purpleGrad)" dot={false} activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No revenue data</div>
        )}
      </div>

      {/* User growth + payment methods */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Weekly new users */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">Growth</p>
          <p className="text-base font-black text-gray-900 mb-5">New Users per Week</p>
          {weeklyNewUsers.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyNewUsers} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(d: string) => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No user data</div>
          )}
        </div>

        {/* Payment method breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">Payments</p>
          <p className="text-base font-black text-gray-900 mb-5">Method Breakdown</p>
          {paymentMethods.length ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={paymentMethods} dataKey="revenue" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                    {paymentMethods.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" iconSize={8} />
                  <Tooltip formatter={(v) => [formatPrice(Number(v)), 'Revenue']} contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {paymentMethods.map((p, i) => (
                  <div key={p.method} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {p.method === 'M-Pesa' ? <Smartphone className="h-3.5 w-3.5 text-green-600" /> : <CreditCard className="h-3.5 w-3.5 text-blue-600" />}
                      <span className="font-medium text-gray-700">{p.method}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{p.count} txns</span>
                      <span className="font-bold" style={{ color: PALETTE[i % PALETTE.length] }}>{formatPrice(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No payment data</div>
          )}
        </div>
      </div>

      {/* Revenue by category + Top customers */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Category revenue */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">Categories</p>
          <p className="text-base font-black text-gray-900 mb-5">Revenue by Category</p>
          {revenueByCategory.length ? (
            <div className="space-y-3">
              {revenueByCategory.map((c, i) => {
                const max = revenueByCategory[0]?.revenue ?? 1;
                const pct = Math.round((c.revenue / max) * 100);
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">{c.category}</span>
                      <span className="font-bold text-gray-900 ml-2 flex-shrink-0">{formatPrice(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No category data</div>
          )}
        </div>

        {/* Top customers */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">VIP</p>
          <p className="text-base font-black text-gray-900 mb-5">Top Customers by Spend</p>
          {topCustomers.length ? (
            <div className="space-y-2.5">
              {topCustomers.slice(0, 8).map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  >
                    {i + 1}
                  </span>
                  <p className="flex-1 text-xs font-medium text-gray-700 truncate">{c.name || 'Unknown'}</p>
                  <p className="text-xs font-bold text-gray-900 flex-shrink-0">{formatPrice(c.totalSpend)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No customer data</div>
          )}
        </div>
      </div>

      {/* User role breakdown */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-500 mb-0.5">Users</p>
        <p className="text-base font-black text-gray-900 mb-5">Role Distribution</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(users.byRole).map(([role, count], i) => (
            <div key={role} className="text-center p-4 rounded-xl border border-gray-100">
              <p className="text-2xl font-black" style={{ color: PALETTE[i % PALETTE.length] }}>{count}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{role.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
