'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Trash2, ShoppingCart, Package } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '@/lib/api/wishlist';
import { addToCart } from '@/lib/api/cart';
import { getCart } from '@/lib/api/cart';
import { useCartStore } from '@/lib/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

export default function WishlistPage() {
  const qc = useQueryClient();
  const { setCart } = useCartStore();

  const { data, isLoading } = useQuery({ queryKey: ['wishlist'], queryFn: () => getWishlist() });
  const items = (data as { data: { id: string; products: Product }[] } | undefined)?.data ?? [];

  const removeMut = useMutation({
    mutationFn: (id: string) => removeFromWishlist(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wishlist'] }); toast.success('Removed'); },
  });

  async function handleAddToCart(productId: string) {
    try {
      await addToCart({ productId, quantity: 1 });
      const r = await getCart();
      setCart(r.data);
      toast.success('Added to cart!');
    } catch { toast.error('Failed to add'); }
  }

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />)}</div>;

  if (!items.length) return (
    <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
      <p className="font-semibold text-gray-700">Your wishlist is empty</p>
      <p className="text-sm text-gray-500 mb-4">Save items you love</p>
      <Link href="/products" className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">Browse Products</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900">Wishlist ({items.length})</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map(({ id, products: p }) => {
          const img = p.primaryImageUrl ?? (p as unknown as { primary_image_url?: string }).primary_image_url;
          const price = p.salePrice ?? p.basePrice;
          return (
            <div key={id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden group">
              <div className="relative h-44">
                <Link href={`/products/${p.slug}`}>
                  {img ? <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 33vw" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Package className="h-10 w-10 text-gray-300" /></div>}
                </Link>
                <button onClick={() => removeMut.mutate(id)} disabled={removeMut.isPending} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-500 hover:bg-red-50 shadow-sm transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-3 space-y-2">
                <Link href={`/products/${p.slug}`}>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-emerald-600 transition-colors">{p.name}</p>
                </Link>
                <p className="font-bold text-gray-900">{formatPrice(price)}</p>
                <button onClick={() => handleAddToCart(p.id)} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#ff7c2a] text-white text-xs font-bold hover:bg-[#e06920] transition-colors">
                  <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
