'use client';
import { TrendingUp, ShoppingBag, Users, Package, AlertTriangle, RefreshCw, TrendingDown, DollarSign, Star } from 'lucide-react';
import {
  useGetDashboardStatsQuery,
  useGetDailyRevenueQuery,
  useGetTopProductsQuery,
  useListLowStockQuery,
} from '@/lib/redux/api/adminApi';
import { formatPrice } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ── Colour tokens ──────────────────────────────────────── */
const GOLD   = '#c9972e';
const FOREST = '#2d7350';
const EARTH  = '#c4551f';
const BARK   = '#7a6248';
const PIE_COLORS = [FOREST, GOLD, EARTH, BARK, '#1a4fa0', '#9c27b0'];

/* ── Skeuomorphic stat card ─────────────────────────────── */
function StatCard({
  label, value, sub, icon: Icon, accent, trend,
}: {
  label:   string;
  value:   string;
  sub?:    string;
  icon:    typeof TrendingUp;
  accent:  string;
  trend?:  'up' | 'down' | 'neutral';
}) {
  return (
    <div className="skeu-card-raised p-5 space-y-3 relative overflow-hidden">
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ background: accent }} />

      <div className="flex items-start justify-between gap-2 relative">
        <p className="text-xs font-bold uppercase tracking-widest text-bark-500">{label}</p>
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]"
          style={{ background: `linear-gradient(145deg, ${accent}dd, ${accent})` }}
        >
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
      </div>

      <p className="text-3xl font-black tracking-tight" style={{ color: '#2a1810', textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}>
        {value}
      </p>

      {sub && (
        <div className="flex items-center gap-1.5">
          {trend === 'up'      && <TrendingUp   className="h-3 w-3 text-green-600" />}
          {trend === 'down'    && <TrendingDown  className="h-3 w-3 text-red-500" />}
          <p className="text-xs font-medium text-bark-500">{sub}</p>
        </div>
      )}

      {/* Bottom groove line */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
    </div>
  );
}

/* ── Custom tooltip ─────────────────────────────────────── */
function ChartTooltip({ active, payload, label, type }: {
  active?: boolean; payload?: {value: number}[]; label?: string; type?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="skeu-card px-3 py-2 text-xs shadow-xl">
      <p className="font-bold text-bark-600 mb-1">{label}</p>
      <p className="font-black text-forest-800">
        {type === 'revenue' ? formatPrice(payload[0].value) : `${payload[0].value} orders`}
      </p>
    </div>
  );
}

/* ── Section heading ────────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="font-black text-sm uppercase tracking-widest text-bark-600">{children}</h2>
      <div className="flex-1 skeu-divider" />
    </div>
  );
}

/* ── Main dashboard ─────────────────────────────────────── */
export default function AdminDashboard() {
  const { data: stats, refetch: refetchStats, isFetching: fetchingStats } = useGetDashboardStatsQuery();
  const { data: rawRevenue = [] } = useGetDailyRevenueQuery(30);
  const { data: top = [] }        = useGetTopProductsQuery(6);
  const { data: lowStock = [] }   = useListLowStockQuery({ threshold: 8 });

  // Normalise revenue data — backend returns {date, revenue} or {revenueDate, totalRevenue}
  const revenue = rawRevenue.map((r) => {
    const d = (r as unknown as Record<string, unknown>);
    return {
      date:    (d.date ?? d.revenueDate ?? '') as string,
      revenue: Number(d.revenue ?? d.totalRevenue ?? 0),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Daily order count — derive from revenue dates (approximation using available data)
  const ordersByStatus = stats ? [
    { name: 'Awaiting Dispatch', value: stats.orders.pending   || 0 },
    { name: 'Dispatched',        value: stats.orders.shipped   || 0 },
    { name: 'Delivered',         value: stats.orders.delivered || 0 },
    { name: 'Other',             value: Math.max(0, (stats.orders.total || 0) - (stats.orders.pending || 0) - (stats.orders.shipped || 0) - (stats.orders.delivered || 0)) },
  ].filter(s => s.value > 0) : [];

  const avgOrderValue = stats && stats.orders.total > 0
    ? stats.revenue30d / stats.orders.total
    : 0;

  const topRevenue = top[0]?.totalRevenue ?? 1;

  return (
    <div className="space-y-7 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bark-800" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.7)' }}>
            Analytics Dashboard
          </h1>
          <p className="text-xs text-bark-400 mt-0.5 font-medium">Live store performance overview</p>
        </div>
        <button
          onClick={() => refetchStats()}
          disabled={fetchingStats}
          className="skeu-btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${fetchingStats ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats ? (
          <>
            <StatCard
              label="Revenue (30d)"
              value={formatPrice(stats.revenue30d)}
              sub={`${stats.orders.total} total orders`}
              icon={DollarSign}
              accent={GOLD}
              trend="up"
            />
            <StatCard
              label="Pending Dispatch"
              value={String(stats.orders.pending)}
              sub="awaiting shipment"
              icon={ShoppingBag}
              accent={EARTH}
              trend="neutral"
            />
            <StatCard
              label="Customers"
              value={String(stats.users.total)}
              sub="registered accounts"
              icon={Users}
              accent={FOREST}
              trend="up"
            />
            <StatCard
              label="Active Products"
              value={String(stats.products.active)}
              sub={`of ${stats.products.total} total`}
              icon={Package}
              accent={BARK}
              trend="neutral"
            />
          </>
        ) : (
          [1,2,3,4].map((i) => (
            <div key={i} className="skeu-card-raised h-36 animate-pulse" />
          ))
        )}
      </div>

      {/* ── Secondary KPI strip ── */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Avg. Order Value',    value: formatPrice(avgOrderValue),        icon: TrendingUp },
            { label: 'Dispatched (30d)',     value: String(stats.orders.shipped ?? 0), icon: Package },
            { label: 'Delivered (30d)',      value: String(stats.orders.delivered ?? 0), icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="skeu-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl skeu-inset flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-bark-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-bark-400">{label}</p>
                <p className="text-xl font-black text-bark-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Revenue chart ── */}
      <div className="skeu-card p-5">
        <SectionTitle>Revenue — Last 30 Days</SectionTitle>
        <div className="skeu-chart-wrap p-4">
          {revenue.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenue} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={FOREST} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={FOREST} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="revLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#52a97d" />
                    <stop offset="100%" stopColor={FOREST} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,100,60,0.12)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9c8068', fontWeight: 600 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  axisLine={{ stroke: 'rgba(140,100,60,0.2)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9c8068', fontWeight: 600 }}
                  tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip type="revenue" />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="url(#revLine)"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: FOREST, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-bark-400 text-sm font-medium">
              No revenue data yet — make your first sale!
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column: Orders by status + Top Products ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Orders by status — pie chart */}
        <div className="skeu-card p-5">
          <SectionTitle>Orders by Status</SectionTitle>
          {ordersByStatus.length ? (
            <div className="skeu-chart-wrap p-3">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Legend
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#7a6248' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Tooltip
                    formatter={(v, name) => [v, name]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid rgba(140,100,60,0.2)', background: '#fdf8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label */}
              <p className="text-center text-xs font-bold text-bark-400 -mt-2">
                {stats?.orders.total ?? 0} total orders
              </p>
            </div>
          ) : (
            <div className="skeu-chart-wrap p-8 text-center text-bark-400 text-sm font-medium">
              No orders yet
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="skeu-card p-5">
          <SectionTitle>Top Products by Revenue</SectionTitle>
          {top.length ? (
            <div className="space-y-3">
              {top.slice(0, 6).map((p, i) => {
                const rev = Number(p.totalRevenue ?? (p as unknown as Record<string,unknown>).total_revenue ?? 0);
                const sold = Number(p.totalSold ?? (p as unknown as Record<string,unknown>).total_qty ?? 0);
                const name = p.productName ?? (p as unknown as Record<string,unknown>).name as string ?? '';
                const pct = topRevenue > 0 ? (rev / topRevenue) * 100 : 0;
                return (
                  <div key={p.productId ?? i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      >
                        {i + 1}
                      </span>
                      <p className="flex-1 text-xs font-semibold text-bark-800 truncate">{name}</p>
                      <p className="text-xs font-black text-bark-700 flex-shrink-0">{formatPrice(rev)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 skeu-progress-track h-2 overflow-hidden ml-7">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${PIE_COLORS[i % PIE_COLORS.length]}bb, ${PIE_COLORS[i % PIE_COLORS.length]})`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-bark-400 font-medium flex-shrink-0 w-14 text-right">
                        {sold} sold
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-bark-400 text-center py-8 font-medium">No sales data yet</p>
          )}
        </div>
      </div>

      {/* ── Revenue bar chart (daily breakdown) ── */}
      {revenue.length > 0 && (
        <div className="skeu-card p-5">
          <SectionTitle>Daily Revenue Breakdown</SectionTitle>
          <div className="skeu-chart-wrap p-4">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenue.slice(-14)} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={GOLD}  stopOpacity={0.9} />
                    <stop offset="100%" stopColor={EARTH} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(140,100,60,0.1)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9c8068', fontWeight: 600 }}
                  tickFormatter={(d: string) => d.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9c8068', fontWeight: 600 }}
                  tickFormatter={(v: number) => `${(v/1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip type="revenue" />} />
                <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Low stock ── */}
      <div className="skeu-card p-5">
        <SectionTitle>
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-earth-600" /> Low Stock Alerts
          </span>
        </SectionTitle>
        {lowStock.length ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {lowStock.map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: p.availableStock <= 2
                    ? 'linear-gradient(135deg, #fdf0ed, #fbe8e4)'
                    : 'linear-gradient(135deg, #fdf8ec, #faf0d8)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08) inset, 0 1px 0 rgba(255,255,255,0.6)',
                  border: `1px solid ${p.availableStock <= 2 ? 'rgba(196,85,31,0.2)' : 'rgba(201,151,46,0.2)'}`,
                }}
              >
                <p className="text-xs font-semibold text-bark-800 truncate flex-1 mr-3">{p.productName}</p>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-black flex-shrink-0"
                  style={{
                    background: p.availableStock <= 2 ? EARTH : GOLD,
                    color: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  {p.availableStock} left
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="skeu-inset p-5 text-center">
            <p className="text-sm font-bold text-forest-700">✓ All products well-stocked</p>
          </div>
        )}
      </div>

    </div>
  );
}
