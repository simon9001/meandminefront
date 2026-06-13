'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import {
  useAdminListProductsQuery,
  useUpdateProductMutation,
  useAdminListCategoriesQuery,
  type CreateProductPayload,
} from '@/lib/redux/api/adminApi';
import { toast } from 'sonner';
import type { Product } from '@/lib/types';

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }     = use(params);
  const router     = useRouter();
  const { data: productsPage } = useAdminListProductsQuery({ limit: 200 });
  const { data: cats = [] }    = useAdminListCategoriesQuery();
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();

  const product: Product | undefined = productsPage?.data.find((p) => p.id === id);

  const [form, setForm]     = useState<Partial<CreateProductPayload>>({});
  const [catId, setCatId]   = useState('');
  const [tagInput, setTagInput] = useState('');
  const [ready, setReady]   = useState(false);

  useEffect(() => {
    if (product && !ready) {
      setForm({
        name:                 product.name,
        slug:                 product.slug,
        shortDescription:     product.shortDescription,
        fullDescription:      product.fullDescription,
        basePrice:            product.basePrice,
        salePrice:            product.salePrice,
        showSalePrice:        product.showSalePrice ?? false,
        status:               product.status,
        isFeatured:           product.isFeatured,
        isNewArrival:         product.isNewArrival,
        isBestSeller:         product.isBestSeller,
        stockWarningThreshold: product.stockWarningThreshold,
        tags:                 product.tags ?? [],
      });
      setCatId(product.category?.id ?? '');
      setReady(true);
    }
  }, [product, ready]);

  function set<K extends keyof CreateProductPayload>(key: K, val: CreateProductPayload[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !(form.tags ?? []).includes(t)) set('tags', [...(form.tags ?? []), t]);
    setTagInput('');
  }

  function removeTag(t: string) {
    set('tags', (form.tags ?? []).filter((x) => x !== t));
  }

  async function handleSave() {
    if (!form.name?.trim() || !form.slug?.trim() || !form.basePrice) {
      toast.error('Name, slug, and base price are required');
      return;
    }
    if (form.salePrice !== undefined && form.salePrice >= form.basePrice) {
      toast.error('Sale price must be less than base price');
      return;
    }
    try {
      await updateProduct({ id, ...form, categoryId: catId || undefined }).unwrap();
      toast.success('Product updated!');
      router.push('/admin/products');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Update failed');
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-400">
        Product not found.{' '}
        <Link href="/admin/products" className="text-emerald-600 hover:underline">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit: {product.name}</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Basic Info</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Name *</label>
          <input value={form.name ?? ''} onChange={(e) => { set('name', e.target.value); }} placeholder="Product name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Slug *</label>
          <input value={form.slug ?? ''} onChange={(e) => set('slug', autoSlug(e.target.value))} placeholder="url-slug"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Short Description</label>
          <input value={form.shortDescription ?? ''} onChange={(e) => set('shortDescription', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Description</label>
          <textarea value={form.fullDescription ?? ''} onChange={(e) => set('fullDescription', e.target.value)}
            rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Pricing & Status</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Base Price (KES) *</label>
            <input type="number" value={form.basePrice ?? 0} onChange={(e) => set('basePrice', Number(e.target.value))} min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Sale Price (KES)</label>
            <input type="number" value={form.salePrice ?? ''} onChange={(e) => set('salePrice', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Leave blank if no sale" min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {form.salePrice !== undefined && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.showSalePrice)}
                  onChange={(e) => set('showSalePrice', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600"
                />
                <span className="text-gray-700">Show sale price &amp; savings badge to customers</span>
              </label>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
            <select value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
              {['active', 'draft', 'archived', 'out_of_stock'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Low Stock Threshold</label>
            <input type="number" value={form.stockWarningThreshold ?? 5} onChange={(e) => set('stockWarningThreshold', Number(e.target.value))} min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {([['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestSeller', 'Best Seller']] as [keyof CreateProductPayload, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)}
                className="rounded border-gray-300 text-emerald-600" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Category & Tags</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
          <select value={catId} onChange={(e) => setCatId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
            <option value="">None</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Tags</label>
          <div className="flex gap-2 mb-2">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Type a tag and press Enter"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button type="button" onClick={addTag} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(form.tags ?? []).map((t) => (
              <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500">✕</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-6">
        <Link href="/admin/products" className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">
          Cancel
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
