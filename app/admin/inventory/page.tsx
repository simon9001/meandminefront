'use client';
import { useState } from 'react';
import { Boxes, AlertTriangle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  useListInventoryQuery,
  useAdjustInventoryMutation,
  useSetInventoryMutation,
  type InventoryItem,
} from '@/lib/redux/api/adminApi';
import { toast } from 'sonner';

type ModalMode = 'adjust' | 'set';

export default function InventoryPage() {
  const [search, setSearch]               = useState('');
  const [lowOnly, setLowOnly]             = useState(false);
  const [modal, setModal]                 = useState<{ item: InventoryItem; mode: ModalMode } | null>(null);
  const [value, setValue]                 = useState(0);
  const [reason, setReason]               = useState('');
  const [saving, setSaving]               = useState(false);

  const { data: items = [], isLoading, refetch } = useListInventoryQuery({ search, lowStock: lowOnly || undefined });
  const [adjust] = useAdjustInventoryMutation();
  const [setStock] = useSetInventoryMutation();

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.mode === 'adjust') {
        await adjust({ productId: modal.item.productId, variantId: modal.item.variantId, delta: value, reason }).unwrap();
        toast.success(`Stock adjusted by ${value > 0 ? '+' : ''}${value}`);
      } else {
        await setStock({ productId: modal.item.productId, variantId: modal.item.variantId, quantity: value, reason }).unwrap();
        toast.success(`Stock set to ${value}`);
      }
      setModal(null);
      setValue(0);
      setReason('');
      refetch();
    } catch { toast.error('Failed to update stock'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="rounded border-gray-300 text-red-600"
            />
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Low stock only
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-48"
          />
        </div>
      </div>

      {/* Adjust / set modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">
              {modal.mode === 'adjust' ? 'Adjust Stock' : 'Set Stock'}
            </h2>
            <p className="text-sm text-gray-600 font-medium">{modal.item.productName}</p>
            <p className="text-xs text-gray-400">Current stock: {modal.item.availableStock}</p>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {modal.mode === 'adjust' ? 'Delta (+ to add, – to remove)' : 'New quantity'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValue((v) => v - 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setValue((v) => v + 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Reason (optional)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Restock, damage, count correction"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setModal(null); setValue(0); setReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Boxes className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No inventory records found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-right px-5 py-3 font-semibold">Available</th>
                <th className="text-right px-5 py-3 font-semibold">Reserved</th>
                <th className="text-right px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const isLow = item.availableStock <= item.warningThreshold;
                return (
                  <tr key={`${item.productId}-${item.variantId ?? ''}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.availableStock}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">{item.reservedStock}</td>
                    <td className="px-5 py-3.5 text-right text-gray-500">{item.totalStock}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setModal({ item, mode: 'adjust' }); setValue(0); }}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => { setModal({ item, mode: 'set' }); setValue(item.availableStock); }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Set
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
