'use client';
import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import {
  useListInventoryQuery,
  useAdjustInventoryMutation,
  useSetInventoryMutation,
  type InventoryItem,
} from '@/lib/redux/api/adminApi';
import { toast } from 'sonner';

type ModalMode = 'adjust' | 'set';

export default function InventoryPage() {
  const [search,  setSearch]  = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [modal,   setModal]   = useState<{ item: InventoryItem; mode: ModalMode } | null>(null);
  const [value,   setValue]   = useState(0);
  const [saving,  setSaving]  = useState(false);

  const { data: allItems = [], isLoading } = useListInventoryQuery();
  const [adjust]   = useAdjustInventoryMutation();
  const [setStock] = useSetInventoryMutation();

  const items = useMemo(() => {
    let list = allItems;
    if (lowOnly) list = list.filter((i) => i.availableStock <= i.warningThreshold);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.productName.toLowerCase().includes(q) ||
        (i.variantName ?? '').toLowerCase().includes(q) ||
        (i.sku ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, lowOnly, search]);

  const lowCount = useMemo(
    () => allItems.filter((i) => i.availableStock <= i.warningThreshold).length,
    [allItems]
  );

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.mode === 'adjust') {
        await adjust({ productId: modal.item.productId, variantId: modal.item.variantId, delta: value }).unwrap();
        toast.success(`Stock adjusted by ${value > 0 ? '+' : ''}${value}`);
      } else {
        await setStock({ productId: modal.item.productId, variantId: modal.item.variantId, quantity: value }).unwrap();
        toast.success(`Stock set to ${value}`);
      }
      setModal(null);
      setValue(0);
    } catch {
      toast.error('Failed to update stock');
    } finally {
      setSaving(false);
    }
  }

  function openModal(item: InventoryItem, mode: ModalMode) {
    setModal({ item, mode });
    setValue(mode === 'set' ? item.availableStock : 0);
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          {lowCount > 0 && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {lowCount} item{lowCount > 1 ? 's' : ''} low on stock
            </p>
          )}
        </div>
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
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 w-full sm:w-52"
          />
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">
              {modal.mode === 'adjust' ? 'Adjust Stock' : 'Set Stock'}
            </h2>
            <div>
              <p className="text-sm font-medium text-gray-900">{modal.item.productName}</p>
              {modal.item.variantName && (
                <p className="text-xs text-forest-700 font-medium mt-0.5">{modal.item.variantName}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Current stock: <strong className="text-gray-700">{modal.item.availableStock}</strong>
                {modal.mode === 'adjust' && value !== 0 && (
                  <> → <strong className={modal.item.availableStock + value < 0 ? 'text-red-600' : 'text-forest-700'}>
                    {Math.max(0, modal.item.availableStock + value)}
                  </strong></>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {modal.mode === 'adjust' ? 'Delta (+ to add, − to remove)' : 'New quantity'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValue((v) => v - 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <button
                  type="button"
                  onClick={() => setValue((v) => v + 1)}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              </div>
              {modal.mode === 'adjust' && (
                <div className="flex gap-2 mt-2">
                  {[-10, -5, -1, +1, +5, +10, +20, +50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue(n)}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        value === n
                          ? 'bg-forest-600 text-white border-forest-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n > 0 ? `+${n}` : n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setModal(null); setValue(0); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (modal.mode === 'adjust' && value === 0)}
                className="flex-1 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Boxes className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {search || lowOnly ? 'No matching inventory records.' : 'No inventory records yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Product / Variant</th>
                <th className="text-right px-5 py-3 font-semibold">Available</th>
                <th className="text-right px-5 py-3 font-semibold">Reserved</th>
                <th className="text-right px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const isLow = item.availableStock <= item.warningThreshold;
                const isOos = item.availableStock === 0;
                return (
                  <tr
                    key={`${item.productId}-${item.variantId ?? ''}`}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-2">
                        {isLow && <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isOos ? 'text-red-600' : 'text-amber-500'}`} />}
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          {item.variantName && (
                            <p className="text-xs text-forest-700 font-medium">{item.variantName}</p>
                          )}
                          {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${isOos ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                      {item.availableStock}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500 tabular-nums">{item.reservedStock}</td>
                    <td className="px-5 py-3.5 text-right text-gray-500 tabular-nums">{item.totalStock}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(item, 'adjust')}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => openModal(item, 'set')}
                          className="px-3 py-1.5 rounded-lg bg-forest-600 text-white text-xs font-medium hover:bg-forest-700 transition-colors"
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
