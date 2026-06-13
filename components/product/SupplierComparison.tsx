'use client';
import { useQuery } from '@tanstack/react-query';
import { getSupplierComparison } from '@/lib/api/products';
import { formatPrice } from '@/lib/utils';
import { CheckCircle, Package } from 'lucide-react';

interface Props { productId: string; onSelect?: (supplyId: string) => void; selectedSupplyId?: string; }

export function SupplierComparison({ productId, onSelect, selectedSupplyId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', productId],
    queryFn: () => getSupplierComparison(productId),
    staleTime: 300_000,
  });

  const suppliers = data?.data ?? [];
  if (isLoading || !suppliers.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-4 w-4 text-emerald-600" />
          Supplier Options — Compare &amp; Choose
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {suppliers.map((s) => (
          <button
            key={s.supplyId}
            onClick={() => onSelect?.(s.supplyId)}
            className={`w-full text-left flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${selectedSupplyId === s.supplyId ? 'bg-emerald-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              {selectedSupplyId === s.supplyId && <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  {s.supplierName}
                  {s.isPreferred && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Preferred</span>}
                </p>
                {s.leadTimeDays != null && (
                  <p className="text-xs text-gray-500">Delivery: {s.leadTimeDays} day{s.leadTimeDays !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">{formatPrice(s.salePrice, s.currency)}</p>
              {s.profitMargin > 0 && (
                <p className="text-xs text-emerald-600">You save {s.profitMargin.toFixed(0)}%</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
