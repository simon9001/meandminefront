'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ScrollText, Search, Loader2, ChevronLeft, ChevronRight,
  ShieldAlert, User, Package, ShoppingBag, CreditCard, X,
} from 'lucide-react';
import { useListAuditLogsQuery } from '@/lib/redux/api/adminApi';
import type { AuditLog } from '@/lib/redux/api/adminApi';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

const ACTION_COLORS: Record<string, string> = {
  'user.created':       'bg-green-100 text-green-700',
  'user.deleted':       'bg-red-100 text-red-700',
  'user.role_changed':  'bg-blue-100 text-blue-700',
  'payment.confirmed':  'bg-emerald-100 text-emerald-700',
  'order.status_updated': 'bg-amber-100 text-amber-700',
};

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  user:    User,
  order:   ShoppingBag,
  product: Package,
  payment: CreditCard,
};

const ACTION_OPTIONS = [
  { value: '',                      label: 'All actions' },
  { value: 'user.created',          label: 'User created' },
  { value: 'user.deleted',          label: 'User deleted' },
  { value: 'user.role_changed',     label: 'Role changed' },
  { value: 'payment.confirmed',     label: 'Payment confirmed' },
  { value: 'order.status_updated',  label: 'Order status updated' },
];

const ROLE_OPTIONS = [
  { value: '',           label: 'All roles' },
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin',      label: 'Admin' },
  { value: 'customer',   label: 'Customer' },
  { value: 'system',     label: 'System' },
];

function DetailsModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Audit Entry</h2>
            <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Action</p>
              <p className="font-semibold text-gray-900">{log.action}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Resource</p>
              <p className="font-semibold text-gray-900">{log.resource_type ?? '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Actor</p>
              <p className="font-semibold text-gray-900 truncate">{log.actor_email ?? 'System'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Actor Role</p>
              <p className="font-semibold text-gray-900 capitalize">{log.actor_role ?? '—'}</p>
            </div>
          </div>
          {log.resource_id && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Resource ID</p>
              <p className="font-mono text-xs text-gray-700 break-all">{log.resource_id}</p>
            </div>
          )}
          {Object.keys(log.details ?? {}).length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1.5">Details</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
          {log.ip_address && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">IP Address</p>
              <p className="font-mono text-xs text-gray-700">{log.ip_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const user   = useAppSelector(selectCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'superadmin') router.replace('/admin');
  }, [user, router]);

  const [page,         setPage]        = useState(1);
  const [search,       setSearch]      = useState('');
  const [actionFilter, setAction]      = useState('');
  const [roleFilter,   setRoleFilter]  = useState('');
  const [detail,       setDetail]      = useState<AuditLog | null>(null);

  const { data, isLoading } = useListAuditLogsQuery({
    page,
    search:       search  || undefined,
    action:       actionFilter || undefined,
    actorRole:    roleFilter   || undefined,
  });

  if (!user || user.role !== 'superadmin') return null;

  const logs  = data?.data ?? [];
  const meta  = data?.meta;
  const total = meta?.total ?? 0;
  const limit = meta?.limit ?? 50;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <ScrollText className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Audit Logs</h1>
          <p className="text-xs text-purple-500 font-semibold">
            Every action on the platform — {total.toLocaleString()} entries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search email, action, ID…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No audit entries found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider bg-gray-50/60">
                  <th className="text-left px-5 py-3 font-semibold">Time</th>
                  <th className="text-left px-5 py-3 font-semibold">Actor</th>
                  <th className="text-left px-5 py-3 font-semibold">Action</th>
                  <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Resource</th>
                  <th className="text-left px-5 py-3 font-semibold hidden lg:table-cell">Details</th>
                  <th className="px-5 py-3 w-14" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const ResIcon = RESOURCE_ICONS[log.resource_type ?? ''] ?? ShieldAlert;
                  const actionColor = ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600';
                  const detailPreview = Object.entries(log.details ?? {})
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(' · ');

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                      onClick={() => setDetail(log)}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(log.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' })}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <p className="text-xs font-medium text-gray-800 truncate max-w-[140px]">
                          {log.actor_email ?? 'System'}
                        </p>
                        {log.actor_role && (
                          <p className="text-[10px] text-gray-400 capitalize">{log.actor_role.replace('_', ' ')}</p>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionColor}`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {log.resource_type ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <ResIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                            <span className="capitalize">{log.resource_type}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                          {detailPreview || '—'}
                        </p>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="text-xs text-purple-500 font-semibold hover:underline">View</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Page {page} of {pages} · {total.toLocaleString()} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && <DetailsModal log={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
