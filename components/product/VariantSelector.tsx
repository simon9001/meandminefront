'use client';
import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/lib/types';

interface Props {
  variants: ProductVariant[];
  selected?: string;
  onChange: (variantId: string) => void;
}

export function VariantSelector({ variants, selected, onChange }: Props) {
  // Group by option key (e.g., Color, Size)
  const optionKeys = Array.from(new Set(variants.flatMap((v) => Object.keys(v.options))));

  if (!variants.length) return null;

  return (
    <div className="space-y-4">
      {optionKeys.map((key) => {
        const values = Array.from(new Set(variants.map((v) => v.options[key]).filter(Boolean)));
        return (
          <div key={key}>
            <p className="text-sm font-semibold text-gray-900 mb-2">{key}</p>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const variant = variants.find((v) => v.options[key] === val);
                if (!variant) return null;
                const isSelected = variant.id === selected;
                const isColor = key.toLowerCase().includes('color') || key.toLowerCase().includes('colour');
                return (
                  <button
                    key={val}
                    onClick={() => onChange(variant.id)}
                    disabled={!variant.isActive}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400',
                      !variant.isActive && 'opacity-40 cursor-not-allowed line-through',
                    )}
                  >
                    {val}
                    {variant.additionalPrice > 0 && <span className="text-xs ml-1 text-gray-500">+KES {variant.additionalPrice}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
