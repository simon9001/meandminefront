'use client';
import { useState } from 'react';
import { Tag, Plus, X, Loader2, Check, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import {
  useListDiscountCodesQuery,
  useCreateDiscountCodeMutation,
  useUpdateDiscountCodeMutation,
  useDeleteDiscountCodeMutation,
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

function codeToForm(c: DiscountCode): CreateDiscountPayload {
  return {
    code:           c.code,
    description:    c.description,
    discountType:   c.discountType,
    discountValue:  c.discountValue,
    minOrderAmount: c.minOrderAmount,
    maxUses:        c.maxUses,
    expiresAt:      c.expiresAt ? c.expiresAt.slice(0, 10) : '',
  };
}

export default function DiscountsPage() {
  const { data: codes = [], isLoading } = useListDiscountCodesQuery();
  const [createCode] = useCreateDiscountCodeMutation();
  const [updateCode] = useUpdateDiscountCodeMutation();
  const [deleteCode] = useDeleteDiscountCodeMutation();

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<DiscountCode | null>(null);
  const [form, setForm]           = useState<CreateDiscountPayload>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(c: DiscountCode) { setEditing(c); setForm(codeToForm(c)); setShowForm(true); }
  function close() { setShowForm(false); setEditing(null); setForm(EMPTY); }

  async function handleSave() {
    if (!form.code.trim() || !form.description.trim()) {
      toast.error('Code and description required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, expiresAt: form.expiresAt || undefined, maxUses: form.maxUses || undefined };
      if (editing) {
        await updateCode({ id: editing.id, ...payload }).unwrap();
        toast.success('Discount code updated');
      } else {
        await createCode(payload).unwrap();
        toast.success('Discount code created');
      }
      close();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: DiscountCode) {
    if (!confirm(`Delete code "${c.code}"? This cannot be undone.`)) return;
    setDeletingId(c.id);
    try {
      await deleteCode(c.id).unwrap();
      toast.success('Discount code deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(c: DiscountCode) {
    try {
      await updateCode({ id: c.id, isActive: !c.isActive }).unwrap();
      toast.success(c.isActive ? 'Code deactivated' : 'Code activated');
    } catch {
      toast.error('Failed to update');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Discount Codes</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Code
        </button>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Code' : 'New Discount Code'}</h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  disabled={!!editing}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Description *</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. 20% off all orders"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Min Order (KES)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.expiresAt ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={close}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>
      ) : codes.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No discount codes yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Code</th>
                <th className="text-left px-5 py-3 font-semibold">Description</th>
                <th className="text-right px-5 py-3 font-semibold">Value</th>
                <th className="text-right px-5 py-3 font-semibold">Uses</th>
                <th className="text-left px-5 py-3 font-semibold">Expires</th>
                <th className="text-center px-5 py-3 font-semibold">Active</th>
                <th className="px-5 py-3" />
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
                        ? <ToggleRight className="h-6 w-6 text-green-500" />
                        : <ToggleLeft className="h-6 w-6 text-gray-300" />
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(code)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(code)}
                        disabled={deletingId === code.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        {deletingId === code.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    </div>
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
