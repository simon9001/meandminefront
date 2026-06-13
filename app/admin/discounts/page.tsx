'use client';
import { useState } from 'react';
import { Tag, Plus, X, Loader2, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useListDiscountCodesQuery,
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
  type DiscountCode,
  type CreateDiscountPayload,
} from '@/lib/redux/api/adminApi';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

const EMPTY: CreateDiscountPayload = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  maxUses: undefined,
  expiresAt: '',
};

export default function DiscountsPage() {
  const { data: codes = [], isLoading } = useListDiscountCodesQuery();
  const [createCode] = useCreateDiscountCodeMutation();
  const [updateCode] = useUpdateDiscountCodeMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<CreateDiscountPayload>(EMPTY);
  const [saving, setSaving]     = useState(false);

  function close() { setShowForm(false); setForm(EMPTY); }

  async function handleSave() {
    if (!form.code.trim() || !form.description.trim()) { toast.error('Code and description required'); return; }
    setSaving(true);
    try {
      await createCode({ ...form, expiresAt: form.expiresAt || undefined, maxUses: form.maxUses || undefined }).unwrap();
      toast.success('Discount code created');
      close();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  async function toggleActive(code: DiscountCode) {
    try {
      await updateCode({ id: code.id, isActive: !code.isActive }).unwrap();
      toast.success(code.isActive ? 'Code deactivated' : 'Code activated');
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Discount Codes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Code
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">New Discount Code</h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. 20% off all orders"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (KES)</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Value *</label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Min Order (KES)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Max Uses</label>
                <input
                  type="number"
                  value={form.maxUses ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Unlimited"
                  min={1}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Creating…' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No discount codes yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Code</th>
                <th className="text-left px-5 py-3 font-semibold">Description</th>
                <th className="text-right px-5 py-3 font-semibold">Value</th>
                <th className="text-right px-5 py-3 font-semibold">Uses</th>
                <th className="text-left px-5 py-3 font-semibold">Expires</th>
                <th className="text-center px-5 py-3 font-semibold">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {codes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-gray-900 tracking-widest text-xs bg-gray-100 px-2 py-1 rounded-lg">
                      {code.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{code.description}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                    {code.discountType === 'percentage' ? `${code.discountValue}%` : formatPrice(code.discountValue)}
                  </td>
                  <td className="px-5 py-3.5 text-right text-gray-500">
                    {code.usedCount}{code.maxUses ? `/${code.maxUses}` : ''}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString('en-KE') : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => toggleActive(code)} className="inline-flex items-center">
                      {code.isActive
                        ? <ToggleRight className="h-6 w-6 text-emerald-600" />
                        : <ToggleLeft className="h-6 w-6 text-gray-300" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
