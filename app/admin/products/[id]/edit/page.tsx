'use client';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, ImagePlus, Loader2, Palette, Pencil, Plus, Ruler, Save, Star, Tag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import {
  useAdminGetProductQuery,
  useUpdateProductMutation,
  useAdminListCategoriesQuery,
  useAddProductMediaMutation,
  useDeleteProductMediaMutation,
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
  useListInventoryQuery,
  useSetInventoryMutation,
  type CreateProductPayload,
} from '@/lib/redux/api/adminApi';
import { toast } from 'sonner';
import type { Product, ProductVariant } from '@/lib/types';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function uid() {
  return Math.random().toString(36).slice(2);
}

// ── Types ──────────────────────────────────────────────────────────────────────

type SavedMedia = { id: string; url: string; isPrimary: boolean; variantId?: string };

// Existing variants (already in DB — have an id)
type ExistingColor = {
  id:        string;
  name:      string;
  hex:       string;
  images:    SavedMedia[];   // from product.media filtered by variantId
  uploading: boolean;
};
type ExistingSize = {
  id:              string;
  name:            string;
  sku:             string;
  additionalPrice: number;
  stockQuantity:   number;
  images:          SavedMedia[];
  uploading:       boolean;
};

// New variants (not yet in DB — no id yet)
type NewColor = {
  tempId:    string;
  name:      string;
  hex:       string;
  images:    { url: string; publicId: string }[];
  uploading: boolean;
};
type NewSize = {
  tempId:          string;
  name:            string;
  sku:             string;
  additionalPrice: number;
  stockQuantity:   number;
  images:          { url: string; publicId: string }[];
  uploading:       boolean;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();

  const { data: cats = [] }                 = useAdminListCategoriesQuery();
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();
  const [addProductMedia]                   = useAddProductMediaMutation();
  const [deleteProductMedia]                = useDeleteProductMediaMutation();
  const [createProductVariant]              = useCreateProductVariantMutation();
  const [updateProductVariant]              = useUpdateProductVariantMutation();
  const [deleteProductVariant]              = useDeleteProductVariantMutation();
  const [setInventory]                      = useSetInventoryMutation();

  const { data: inventoryItems = [] } = useListInventoryQuery();

  // Use the admin endpoint — fetches from products table directly (not the view),
  // so draft / archived / out_of_stock products all load correctly.
  const { data: fullProduct } = useAdminGetProductQuery(id);

  const product: Product | undefined = fullProduct;

  const [form, setForm]         = useState<Partial<CreateProductPayload>>({});
  const [catId, setCatId]       = useState('');
  const [tagInput, setTagInput] = useState('');
  const [ready, setReady]       = useState(false);
  const [variantsEnabled, setVariantsEnabled] = useState(false);
  const [variantTab, setVariantTab] = useState<'colors' | 'sizes'>('colors');
  const [stockQty, setStockQty] = useState(0);

  // Tracks which existing variant is being inline-edited
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; additionalPrice: number; sku: string; stockQuantity: number }>({ name: '', additionalPrice: 0, sku: '', stockQuantity: 0 });

  // General (non-variant) images
  const [media, setMedia]           = useState<SavedMedia[]>([]);
  const [uploading, setUploading]   = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  // Existing variants (from DB)
  const [existingColors, setExistingColors] = useState<ExistingColor[]>([]);
  const [existingSizes,  setExistingSizes]  = useState<ExistingSize[]>([]);

  // New variants being added in this edit session
  const [newColors, setNewColors] = useState<NewColor[]>([]);
  const [newSizes,  setNewSizes]  = useState<NewSize[]>([]);

  // Per-variant file refs
  const existingColorFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const newColorFileRefs      = useRef<Record<string, HTMLInputElement | null>>({});
  const existingSizeFileRefs  = useRef<Record<string, HTMLInputElement | null>>({});
  const newSizeFileRefs       = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Seed state from product ────────────────────────────────────────────────

  useEffect(() => {
    if (!fullProduct || ready) return;

    setForm({
      name:                  fullProduct.name,
      slug:                  fullProduct.slug,
      shortDescription:      fullProduct.shortDescription,
      fullDescription:       fullProduct.fullDescription,
      basePrice:             fullProduct.basePrice,
      salePrice:             fullProduct.salePrice,
      showSalePrice:         fullProduct.showSalePrice ?? false,
      status:                fullProduct.status,
      isFeatured:            fullProduct.isFeatured,
      isNewArrival:          fullProduct.isNewArrival,
      isBestSeller:          fullProduct.isBestSeller,
      stockWarningThreshold: fullProduct.stockWarningThreshold,
      tags:                  fullProduct.tags ?? [],
    });
    setCatId(fullProduct.category?.id ?? '');

    const allMedia = (fullProduct.media ?? []) as SavedMedia[];
    setMedia(allMedia.filter((m) => !m.variantId));

    const variants: ProductVariant[] = fullProduct.variants ?? [];
    const colorVars = variants.filter((v) => 'color' in v.options);
    const sizeVars  = variants.filter((v) => 'size'  in v.options);

    setExistingColors(colorVars.map((v) => ({
      id:        v.id,
      name:      v.options.color ?? v.name,
      hex:       v.options.colorHex ?? '#c47b2a',
      images:    allMedia.filter((m) => m.variantId === v.id),
      uploading: false,
    })));

    setExistingSizes(sizeVars.map((v) => ({
      id:              v.id,
      name:            v.options.size ?? v.name,
      sku:             v.sku ?? '',
      additionalPrice: v.additionalPrice ?? 0,
      stockQuantity:   v.stockQuantity ?? 0,
      images:          allMedia.filter((m) => m.variantId === v.id),
      uploading:       false,
    })));

    if (colorVars.length > 0 || sizeVars.length > 0) setVariantsEnabled(true);

    setReady(true);
  }, [fullProduct, ready]);

  // Seed base stock once when inventory data arrives (separate from main seed to avoid loop)
  const stockSeededRef = useRef(false);
  useEffect(() => {
    if (stockSeededRef.current || !ready || variantsEnabled) return;
    const baseInv = inventoryItems.find((i) => i.productId === id && !i.variantId);
    if (baseInv !== undefined) {
      setStockQty(baseInv.availableStock);
      stockSeededRef.current = true;
    }
  }, [inventoryItems, id, ready, variantsEnabled]);

  // ── Field helpers ──────────────────────────────────────────────────────────

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

  // ── General image upload ────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        const isPrimary = media.length === 0;
        const saved = await addProductMedia({
          productId: id, url: json.data.url, isPrimary, mediaType: 'image', displayOrder: media.length,
        }).unwrap();
        setMedia((prev) => [...prev, { id: saved.id, url: saved.url, isPrimary: isPrimary && prev.length === 0 }]);
      }
      toast.success('Image(s) uploaded');
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDeleteMedia(m: SavedMedia) {
    try {
      await deleteProductMedia({ productId: id, mediaId: m.id }).unwrap();
      setMedia((prev) => {
        const next = prev.filter((x) => x.id !== m.id);
        if (m.isPrimary && next.length > 0) return next.map((x, i) => ({ ...x, isPrimary: i === 0 }));
        return next;
      });
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove image');
    }
  }

  // ── Existing color variant image management ─────────────────────────────────

  async function handleExistingColorImageUpload(colorId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setExistingColors((prev) => prev.map((c) => c.id === colorId ? { ...c, uploading: true } : c));
    try {
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        const saved = await addProductMedia({
          productId: id,
          url:          json.data.url,
          isPrimary:    false,
          mediaType:    'image',
          displayOrder: 0,
          variantId:    colorId,
        }).unwrap();
        setExistingColors((prev) => prev.map((c) =>
          c.id === colorId ? { ...c, images: [...c.images, { id: saved.id, url: saved.url, isPrimary: false, variantId: colorId }] } : c
        ));
      }
      toast.success('Image(s) added to color');
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setExistingColors((prev) => prev.map((c) => c.id === colorId ? { ...c, uploading: false } : c));
      const ref = existingColorFileRefs.current[colorId];
      if (ref) ref.value = '';
    }
  }

  async function handleDeleteColorImage(colorId: string, img: SavedMedia) {
    try {
      await deleteProductMedia({ productId: id, mediaId: img.id }).unwrap();
      setExistingColors((prev) => prev.map((c) =>
        c.id === colorId ? { ...c, images: c.images.filter((i) => i.id !== img.id) } : c
      ));
    } catch {
      toast.error('Failed to remove image');
    }
  }

  async function handleDeleteExistingColor(colorId: string) {
    try {
      await deleteProductVariant({ productId: id, variantId: colorId }).unwrap();
      setExistingColors((prev) => prev.filter((c) => c.id !== colorId));
      toast.success('Color variant removed');
    } catch {
      toast.error('Failed to remove color');
    }
  }

  async function handleDeleteExistingSize(sizeId: string) {
    try {
      await deleteProductVariant({ productId: id, variantId: sizeId }).unwrap();
      setExistingSizes((prev) => prev.filter((s) => s.id !== sizeId));
      toast.success('Size variant removed');
    } catch {
      toast.error('Failed to remove size');
    }
  }

  // ── Existing size variant image management ──────────────────────────────────

  async function handleExistingSizeImageUpload(sizeId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setExistingSizes((prev) => prev.map((s) => s.id === sizeId ? { ...s, uploading: true } : s));
    try {
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        const saved = await addProductMedia({
          productId:    id,
          url:          json.data.url,
          isPrimary:    false,
          mediaType:    'image',
          displayOrder: 0,
          variantId:    sizeId,
        }).unwrap();
        setExistingSizes((prev) => prev.map((s) =>
          s.id === sizeId ? { ...s, images: [...s.images, { id: saved.id, url: saved.url, isPrimary: false, variantId: sizeId }] } : s
        ));
      }
      toast.success('Image(s) added to size');
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setExistingSizes((prev) => prev.map((s) => s.id === sizeId ? { ...s, uploading: false } : s));
      const ref = existingSizeFileRefs.current[sizeId];
      if (ref) ref.value = '';
    }
  }

  async function handleDeleteSizeImage(sizeId: string, img: SavedMedia) {
    try {
      await deleteProductMedia({ productId: id, mediaId: img.id }).unwrap();
      setExistingSizes((prev) => prev.map((s) =>
        s.id === sizeId ? { ...s, images: s.images.filter((i) => i.id !== img.id) } : s
      ));
    } catch {
      toast.error('Failed to remove image');
    }
  }

  // ── New color variant management ────────────────────────────────────────────

  function addNewColor() {
    setNewColors((prev) => [...prev, { tempId: uid(), name: '', hex: '#c47b2a', images: [], uploading: false }]);
  }
  function updateNewColor(tempId: string, patch: Partial<Omit<NewColor, 'tempId'>>) {
    setNewColors((prev) => prev.map((c) => c.tempId === tempId ? { ...c, ...patch } : c));
  }
  function removeNewColor(tempId: string) {
    setNewColors((prev) => prev.filter((c) => c.tempId !== tempId));
  }

  async function handleNewColorImageUpload(tempId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    updateNewColor(tempId, { uploading: true });
    try {
      const uploaded: { url: string; publicId: string }[] = [];
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        uploaded.push({ url: json.data.url, publicId: json.data.publicId });
      }
      setNewColors((prev) => prev.map((c) =>
        c.tempId === tempId ? { ...c, images: [...c.images, ...uploaded], uploading: false } : c
      ));
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
      updateNewColor(tempId, { uploading: false });
    } finally {
      const ref = newColorFileRefs.current[tempId];
      if (ref) ref.value = '';
    }
  }

  // ── New size variant management ─────────────────────────────────────────────

  function addNewSize() {
    setNewSizes((prev) => [...prev, { tempId: uid(), name: '', sku: '', additionalPrice: 0, stockQuantity: 0, images: [], uploading: false }]);
  }
  function updateNewSize(tempId: string, patch: Partial<Omit<NewSize, 'tempId'>>) {
    setNewSizes((prev) => prev.map((s) => s.tempId === tempId ? { ...s, ...patch } : s));
  }

  async function handleNewSizeImageUpload(tempId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    updateNewSize(tempId, { uploading: true });
    try {
      const uploaded: { url: string; publicId: string }[] = [];
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        uploaded.push({ url: json.data.url, publicId: json.data.publicId });
      }
      setNewSizes((prev) => prev.map((s) =>
        s.tempId === tempId ? { ...s, images: [...s.images, ...uploaded], uploading: false } : s
      ));
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
      updateNewSize(tempId, { uploading: false });
    } finally {
      const ref = newSizeFileRefs.current[tempId];
      if (ref) ref.value = '';
    }
  }

  // ── Inline variant edit ─────────────────────────────────────────────────────

  function startEditVariant(sv: ExistingSize) {
    setEditingVariantId(sv.id);
    setEditDraft({ name: sv.name, additionalPrice: sv.additionalPrice, sku: sv.sku, stockQuantity: sv.stockQuantity });
  }

  async function saveInlineEdit(sv: ExistingSize) {
    try {
      await updateProductVariant({
        productId:       id,
        variantId:       sv.id,
        name:            editDraft.name || undefined,
        options:         editDraft.name ? { size: editDraft.name } : undefined,
        additionalPrice: editDraft.additionalPrice,
        sku:             editDraft.sku || undefined,
        stockQuantity:   editDraft.stockQuantity,
      }).unwrap();
      setExistingSizes((prev) => prev.map((s) =>
        s.id === sv.id
          ? { ...s, name: editDraft.name || s.name, additionalPrice: editDraft.additionalPrice, sku: editDraft.sku, stockQuantity: editDraft.stockQuantity }
          : s
      ));
      setEditingVariantId(null);
      toast.success('Variant updated');
    } catch {
      toast.error('Failed to update variant');
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

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
      // 1 — Update core product fields
      await updateProduct({ id, ...form, categoryId: catId || undefined }).unwrap();

      // 1b — Set base stock when no variants
      if (!variantsEnabled && stockQty >= 0) {
        await setInventory({ productId: id, quantity: stockQty }).unwrap().catch(() => {});
      }

      // 2 — Create new color variants + their images
      for (const cv of newColors) {
        if (!cv.name.trim()) continue;
        const variant = await createProductVariant({
          productId: id,
          name:      cv.name,
          options:   { color: cv.name, colorHex: cv.hex },
        }).unwrap().catch(() => null);
        if (variant) {
          for (let i = 0; i < cv.images.length; i++) {
            await addProductMedia({
              productId:    id,
              url:          cv.images[i].url,
              isPrimary:    i === 0,
              mediaType:    'image',
              displayOrder: i,
              variantId:    variant.id,
            }).unwrap().catch(() => {});
          }
        }
      }

      // 3 — Create new size variants + their images
      for (const sv of newSizes) {
        if (!sv.name.trim()) continue;
        const variant = await createProductVariant({
          productId:       id,
          name:            sv.name,
          options:         { size: sv.name },
          additionalPrice: sv.additionalPrice,
          sku:             sv.sku || undefined,
          stockQuantity:   sv.stockQuantity,
        }).unwrap().catch(() => null);
        if (variant) {
          for (let i = 0; i < sv.images.length; i++) {
            await addProductMedia({
              productId:    id,
              url:          sv.images[i].url,
              isPrimary:    false,
              mediaType:    'image',
              displayOrder: i,
              variantId:    variant.id,
            }).unwrap().catch(() => {});
          }
        }
      }

      setNewColors([]);
      setNewSizes([]);
      toast.success('Product updated!');
      router.push('/admin/products');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Update failed');
    }
  }

  const isBusy = saving || uploading
    || existingColors.some((c) => c.uploading)
    || newColors.some((c) => c.uploading)
    || existingSizes.some((s) => s.uploading)
    || newSizes.some((s) => s.uploading);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-gray-400">
        Product not found.{' '}
        <Link href="/admin/products" className="text-forest-600 hover:underline">Back to products</Link>
      </div>
    );
  }

  const totalColorCount = existingColors.length + newColors.length;
  const totalSizeCount  = existingSizes.length + newSizes.length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Edit: {product.name}</h1>
      </div>

      {/* ── Basic Info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Basic Info</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Name *</label>
          <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Product name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Slug *</label>
          <input value={form.slug ?? ''} onChange={(e) => set('slug', autoSlug(e.target.value))} placeholder="url-slug"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Short Description</label>
          <input value={form.shortDescription ?? ''} onChange={(e) => set('shortDescription', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Description</label>
          <textarea value={form.fullDescription ?? ''} onChange={(e) => set('fullDescription', e.target.value)}
            rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none" />
        </div>
      </div>

      {/* ── General Images ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Product Images</h2>
          <p className="text-xs text-gray-500 mt-1">General images (no color). Color-specific images are managed in the Variants section below.</p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50">
          {uploading
            ? <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-xs">Uploading…</span></>
            : <><ImagePlus className="h-5 w-5" /><span className="text-xs font-medium">Click to add images</span></>}
        </button>

        {media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {media.map((m) => (
              <div key={m.id} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="Product" className="w-full h-28 object-cover rounded-xl border border-gray-200" />
                {m.isPrimary && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-forest-600 text-white text-[10px] font-bold">
                    <Star className="h-2.5 w-2.5" /> Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <button type="button" onClick={() => handleDeleteMedia(m)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Variants ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Variants</h2>
            <p className="text-xs text-gray-500 mt-1">Manage existing colors/sizes or add new ones. Deleting an existing variant is immediate.</p>
          </div>
          <button
            type="button"
            onClick={() => setVariantsEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              variantsEnabled ? 'bg-forest-600' : 'bg-gray-200'
            }`}
            role="switch"
            aria-checked={variantsEnabled}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
              variantsEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {variantsEnabled && <>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-gray-100">
          {(['colors', 'sizes'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setVariantTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                variantTab === tab
                  ? 'border-forest-600 text-forest-700 bg-forest-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab === 'colors' ? <Palette className="h-3.5 w-3.5" /> : <Ruler className="h-3.5 w-3.5" />}
              {tab === 'colors' ? `Colors (${totalColorCount})` : `Sizes (${totalSizeCount})`}
            </button>
          ))}
        </div>

        {/* ── Colors ── */}
        {variantTab === 'colors' && (
          <div className="space-y-4">

            {/* Existing colors */}
            {existingColors.map((cv) => (
              <div key={cv.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg border border-gray-300 flex-shrink-0" style={{ backgroundColor: cv.hex }} title={cv.hex} />
                  <span className="flex-1 text-sm font-semibold text-gray-800">{cv.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">saved</span>
                  <button type="button" onClick={() => handleDeleteExistingColor(cv.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete this color">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Color images */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images for this color</p>
                  <input type="file" accept="image/*" multiple className="hidden"
                    ref={(el) => { existingColorFileRefs.current[cv.id] = el; }}
                    onChange={(e) => handleExistingColorImageUpload(cv.id, e)} />
                  <div className="flex flex-wrap gap-2">
                    {cv.images.map((img) => (
                      <div key={img.id} className="relative group w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => handleDeleteColorImage(cv.id, img)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      </div>
                    ))}
                    <button type="button" disabled={cv.uploading}
                      onClick={() => existingColorFileRefs.current[cv.id]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50">
                      {cv.uploading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><ImagePlus className="h-4 w-4" /><span className="text-[10px] mt-0.5">Add</span></>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* New colors being added */}
            {newColors.map((cv) => (
              <div key={cv.tempId} className="border border-forest-200 bg-forest-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input type="color" value={cv.hex}
                    onChange={(e) => updateNewColor(cv.tempId, { hex: e.target.value })}
                    className="h-8 w-10 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                  <input value={cv.name} onChange={(e) => updateNewColor(cv.tempId, { name: e.target.value })}
                    placeholder="Color name (e.g. Burgundy)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
                  <span className="text-xs text-forest-600 bg-forest-100 px-2 py-0.5 rounded-full">new</span>
                  <button type="button" onClick={() => removeNewColor(cv.tempId)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images for this color</p>
                  <input type="file" accept="image/*" multiple className="hidden"
                    ref={(el) => { newColorFileRefs.current[cv.tempId] = el; }}
                    onChange={(e) => handleNewColorImageUpload(cv.tempId, e)} />
                  <div className="flex flex-wrap gap-2">
                    {cv.images.map((img, imgIdx) => (
                      <div key={img.url} className="relative group w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button type="button"
                          onClick={() => updateNewColor(cv.tempId, { images: cv.images.filter((_, i) => i !== imgIdx) })}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      </div>
                    ))}
                    <button type="button" disabled={cv.uploading}
                      onClick={() => newColorFileRefs.current[cv.tempId]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50">
                      {cv.uploading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><ImagePlus className="h-4 w-4" /><span className="text-[10px] mt-0.5">Add</span></>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addNewColor}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-forest-400 hover:text-forest-700 transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Add Color
            </button>
          </div>
        )}

        {/* ── Sizes ── */}
        {variantTab === 'sizes' && (
          <div className="space-y-4">
            {(existingSizes.length > 0 || newSizes.length > 0) && (
              <p className="text-xs text-gray-500 px-1">
                Base price: <strong>KES {(form.basePrice ?? 0).toLocaleString()}</strong>. Additional price is added on top. You can also attach images for each size.
              </p>
            )}

            {/* Existing sizes */}
            {existingSizes.map((sv) => (
              <div key={sv.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                {/* Header row */}
                {editingVariantId === sv.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="Size name"
                        className="flex-1 px-3 py-1.5 border border-forest-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-gray-500">+ KES</span>
                        <input
                          type="number"
                          value={editDraft.additionalPrice}
                          onChange={(e) => setEditDraft((d) => ({ ...d, additionalPrice: Number(e.target.value) }))}
                          className="w-20 px-2 py-1.5 border border-forest-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-right"
                        />
                      </div>
                      <button type="button" onClick={() => saveInlineEdit(sv)}
                        className="p-1.5 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors" title="Save">
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingVariantId(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Cancel">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <input
                          value={editDraft.sku}
                          onChange={(e) => setEditDraft((d) => ({ ...d, sku: e.target.value }))}
                          placeholder="SKU (optional)"
                          className="flex-1 px-3 py-1.5 border border-forest-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-gray-500">Stock</span>
                        <input
                          type="number"
                          value={editDraft.stockQuantity}
                          onChange={(e) => setEditDraft((d) => ({ ...d, stockQuantity: Math.max(0, Number(e.target.value)) }))}
                          onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                          min={0}
                          className="w-20 px-2 py-1.5 border border-forest-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-right"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-800">{sv.name}</span>
                      {sv.sku && <span className="ml-2 text-xs text-gray-400 font-mono">SKU: {sv.sku}</span>}
                    </div>
                    <span className="text-xs text-gray-400">
                      {sv.additionalPrice !== 0 ? `${sv.additionalPrice > 0 ? '+' : ''}KES ${sv.additionalPrice.toLocaleString()}` : 'same price'}
                    </span>
                    {form.basePrice && (
                      <span className="text-xs font-bold text-forest-700 w-28 text-right">
                        = KES {((form.basePrice ?? 0) + sv.additionalPrice).toLocaleString()}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sv.stockQuantity === 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'}`}>
                      {sv.stockQuantity} in stock
                    </span>
                    <button type="button" onClick={() => startEditVariant(sv)}
                      className="p-1.5 text-gray-400 hover:text-forest-600 hover:bg-forest-50 rounded-lg transition-colors" title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => handleDeleteExistingSize(sv.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {/* Size images */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images for this size <span className="text-gray-400 font-normal">(optional)</span></p>
                  <input type="file" accept="image/*" multiple className="hidden"
                    ref={(el) => { existingSizeFileRefs.current[sv.id] = el; }}
                    onChange={(e) => handleExistingSizeImageUpload(sv.id, e)} />
                  <div className="flex flex-wrap gap-2">
                    {sv.images.map((img) => (
                      <div key={img.id} className="relative group w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={() => handleDeleteSizeImage(sv.id, img)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      </div>
                    ))}
                    <button type="button" disabled={sv.uploading}
                      onClick={() => existingSizeFileRefs.current[sv.id]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50">
                      {sv.uploading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><ImagePlus className="h-4 w-4" /><span className="text-[10px] mt-0.5">Add</span></>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* New sizes */}
            {newSizes.map((sv) => (
              <div key={sv.tempId} className="border border-forest-200 bg-forest-50/30 rounded-xl p-4 space-y-3">
                {/* Name + price row */}
                <div className="flex items-center gap-3">
                  <input value={sv.name} onChange={(e) => updateNewSize(sv.tempId, { name: e.target.value })}
                    placeholder="Size name (e.g. King Size, 200×230cm)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-500">+ KES</span>
                    <input type="number" value={sv.additionalPrice}
                      onChange={(e) => updateNewSize(sv.tempId, { additionalPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-right" />
                  </div>
                  {(form.basePrice ?? 0) > 0 && (
                    <span className="text-xs font-bold text-forest-700 w-28 text-right">
                      = KES {((form.basePrice ?? 0) + sv.additionalPrice).toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-forest-600 bg-forest-100 px-2 py-0.5 rounded-full">new</span>
                  <button type="button" onClick={() => setNewSizes((p) => p.filter((s) => s.tempId !== sv.tempId))}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* SKU + stock row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <input value={sv.sku} onChange={(e) => updateNewSize(sv.tempId, { sku: e.target.value })}
                      placeholder="SKU (optional)"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-500">Stock</span>
                    <input
                      type="number"
                      value={sv.stockQuantity}
                      onChange={(e) => updateNewSize(sv.tempId, { stockQuantity: Math.max(0, Number(e.target.value)) })}
                      onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                      min={0}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-right"
                    />
                  </div>
                </div>
                {/* Size images */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images for this size <span className="text-gray-400 font-normal">(optional)</span></p>
                  <input type="file" accept="image/*" multiple className="hidden"
                    ref={(el) => { newSizeFileRefs.current[sv.tempId] = el; }}
                    onChange={(e) => handleNewSizeImageUpload(sv.tempId, e)} />
                  <div className="flex flex-wrap gap-2">
                    {sv.images.map((img, imgIdx) => (
                      <div key={img.url} className="relative group w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button type="button"
                          onClick={() => updateNewSize(sv.tempId, { images: sv.images.filter((_, i) => i !== imgIdx) })}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      </div>
                    ))}
                    <button type="button" disabled={sv.uploading}
                      onClick={() => newSizeFileRefs.current[sv.tempId]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50">
                      {sv.uploading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><ImagePlus className="h-4 w-4" /><span className="text-[10px] mt-0.5">Add</span></>}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addNewSize}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-forest-400 hover:text-forest-700 transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Add Size
            </button>
          </div>
        )}

        </>}
      </div>

      {/* ── Pricing & Status ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Pricing & Status</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Base Price (KES) *</label>
            <input type="number" value={form.basePrice ?? 0} onChange={(e) => set('basePrice', Number(e.target.value))}
              onFocus={(e) => { if (e.target.value === '0') e.target.select(); }} min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Sale Price (KES)</label>
            <input type="number" value={form.salePrice ?? ''} onChange={(e) => { const n = Number(e.target.value); set('salePrice', n > 0 ? n : undefined); }}
              placeholder="Leave blank if no sale" min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
            {form.salePrice !== undefined && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={Boolean(form.showSalePrice)} onChange={(e) => set('showSalePrice', e.target.checked)}
                  className="rounded border-gray-300 text-forest-600" />
                <span className="text-gray-700">Show sale price &amp; savings badge to customers</span>
              </label>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
            <select value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white">
              {['active', 'draft', 'archived', 'out_of_stock'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Low Stock Threshold</label>
            <input type="number" value={form.stockWarningThreshold ?? 5} onChange={(e) => set('stockWarningThreshold', Number(e.target.value))} min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          </div>
          {!variantsEnabled && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Stock Quantity</label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(Math.max(0, Number(e.target.value)))}
                onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                min={0}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
              <p className="text-xs text-gray-400 mt-1">Current units in stock. Saved when you click Save Changes.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          {([['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestSeller', 'Best Seller']] as [keyof CreateProductPayload, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input type="checkbox" checked={Boolean(form[key])} onChange={(e) => set(key, e.target.checked)}
                className="rounded border-gray-300 text-forest-600" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Category & Tags ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Category & Tags</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
          <select value={catId} onChange={(e) => setCatId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white">
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
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
            <button type="button" onClick={addTag} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(form.tags ?? []).map((t) => (
              <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-medium">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500">✕</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pb-6">
        <Link href="/admin/products"
          className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">
          Cancel
        </Link>
        <button onClick={handleSave} disabled={isBusy}
          className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-forest-900 text-white text-sm font-bold hover:bg-forest-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
