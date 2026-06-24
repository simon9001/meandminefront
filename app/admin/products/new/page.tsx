'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, ImagePlus, Plus, Trash2, Palette, Ruler, Tag } from 'lucide-react';
import Link from 'next/link';
import {
  useCreateProductMutation,
  useAdminListCategoriesQuery,
  useAddProductMediaMutation,
  useDeleteUploadedImageMutation,
  useCreateProductVariantMutation,
  useSetInventoryMutation,
  type CreateProductPayload,
} from '@/lib/redux/api/adminApi';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

const INITIAL: Omit<CreateProductPayload, 'isBestSeller'> = {
  name: '',
  slug: '',
  shortDescription: '',
  fullDescription: '',
  basePrice: 0,
  salePrice: undefined,
  showSalePrice: false,
  status: 'draft',
  isFeatured: false,
  isNewArrival: false,
  stockWarningThreshold: 5,
  tags: [],
};

type UploadedImage = { url: string; publicId: string; isPrimary: boolean };

type ColorVariant = {
  tempId:    string;
  name:      string;
  hex:       string;
  images:    UploadedImage[];
  uploading: boolean;
};

type SizeVariant = {
  tempId:          string;
  name:            string;
  sku:             string;
  additionalPrice: number;
  stockQuantity:   number;
  images:          UploadedImage[];
  uploading:       boolean;
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function autoSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function NewProductPage() {
  const router = useRouter();
  const [createProduct,       { isLoading }]   = useCreateProductMutation();
  const [addProductMedia]                       = useAddProductMediaMutation();
  const [deleteUploadedImage]                   = useDeleteUploadedImageMutation();
  const [createProductVariant]                  = useCreateProductVariantMutation();
  const [setInventory]                          = useSetInventoryMutation();
  const { data: cats = [] }                     = useAdminListCategoriesQuery();

  const [form, setForm]         = useState(INITIAL);
  const [tagInput, setTagInput] = useState('');
  const [catId, setCatId]       = useState('');
  const [stockQty, setStockQty] = useState(0);

  // General images (no color association)
  const [images, setImages]     = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef                 = useRef<HTMLInputElement>(null);

  // Color variants
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const colorFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Size variants
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>([]);
  const sizeFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Variants enabled toggle
  const [variantsEnabled, setVariantsEnabled] = useState(false);

  // Active variant tab
  const [variantTab, setVariantTab] = useState<'colors' | 'sizes'>('colors');

  function set<K extends keyof typeof INITIAL>(key: K, val: (typeof INITIAL)[K]) {
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

  // ── General image upload ─────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        setImages((prev) => [...prev, { url: json.data.url, publicId: json.data.publicId, isPrimary: prev.length === 0 }]);
      }
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function setPrimary(idx: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  }

  function removeImage(idx: number) {
    const img = images[idx];
    deleteUploadedImage({ publicId: img.publicId }).catch(() => {});
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx].isPrimary && next.length > 0) return next.map((im, i) => ({ ...im, isPrimary: i === 0 }));
      return next;
    });
  }

  // ── Color variants ───────────────────────────────────────────────────────────

  function addColor() {
    setColorVariants((prev) => [...prev, { tempId: uid(), name: '', hex: '#c47b2a', images: [], uploading: false }]);
  }

  function updateColor(tempId: string, patch: Partial<Omit<ColorVariant, 'tempId'>>) {
    setColorVariants((prev) => prev.map((c) => c.tempId === tempId ? { ...c, ...patch } : c));
  }

  function removeColor(tempId: string) {
    const cv = colorVariants.find((c) => c.tempId === tempId);
    if (cv) cv.images.forEach((img) => deleteUploadedImage({ publicId: img.publicId }).catch(() => {}));
    setColorVariants((prev) => prev.filter((c) => c.tempId !== tempId));
  }

  async function handleColorImageUpload(tempId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    updateColor(tempId, { uploading: true });
    try {
      const newImages: UploadedImage[] = [];
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        newImages.push({ url: json.data.url, publicId: json.data.publicId, isPrimary: false });
      }
      setColorVariants((prev) => prev.map((c) =>
        c.tempId === tempId
          ? { ...c, images: [...c.images, ...newImages], uploading: false }
          : c
      ));
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added to color`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
      updateColor(tempId, { uploading: false });
    } finally {
      const ref = colorFileRefs.current[tempId];
      if (ref) ref.value = '';
    }
  }

  function removeColorImage(colorTempId: string, imgIdx: number) {
    const cv  = colorVariants.find((c) => c.tempId === colorTempId);
    if (!cv) return;
    deleteUploadedImage({ publicId: cv.images[imgIdx].publicId }).catch(() => {});
    updateColor(colorTempId, { images: cv.images.filter((_, i) => i !== imgIdx) });
  }

  // ── Size variants ────────────────────────────────────────────────────────────

  function addSize() {
    setSizeVariants((prev) => [...prev, { tempId: uid(), name: '', sku: '', additionalPrice: 0, stockQuantity: 0, images: [], uploading: false }]);
  }

  function updateSize(tempId: string, patch: Partial<Omit<SizeVariant, 'tempId'>>) {
    setSizeVariants((prev) => prev.map((s) => s.tempId === tempId ? { ...s, ...patch } : s));
  }

  function removeSize(tempId: string) {
    const sv = sizeVariants.find((s) => s.tempId === tempId);
    if (sv) sv.images.forEach((img) => deleteUploadedImage({ publicId: img.publicId }).catch(() => {}));
    setSizeVariants((prev) => prev.filter((s) => s.tempId !== tempId));
  }

  async function handleSizeImageUpload(tempId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    updateSize(tempId, { uploading: true });
    try {
      const newImages: UploadedImage[] = [];
      for (const file of files) {
        const fd  = new FormData();
        fd.append('file', file);
        const res  = await fetch(`${API}/upload/product`, { method: 'POST', credentials: 'include', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
        newImages.push({ url: json.data.url, publicId: json.data.publicId, isPrimary: false });
      }
      setSizeVariants((prev) => prev.map((s) =>
        s.tempId === tempId ? { ...s, images: [...s.images, ...newImages], uploading: false } : s
      ));
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added to size`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
      updateSize(tempId, { uploading: false });
    } finally {
      const ref = sizeFileRefs.current[tempId];
      if (ref) ref.value = '';
    }
  }

  function removeSizeImage(sizeTempId: string, imgIdx: number) {
    const sv = sizeVariants.find((s) => s.tempId === sizeTempId);
    if (!sv) return;
    deleteUploadedImage({ publicId: sv.images[imgIdx].publicId }).catch(() => {});
    updateSize(sizeTempId, { images: sv.images.filter((_, i) => i !== imgIdx) });
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim() || form.basePrice <= 0) {
      toast.error('Name, slug, and base price are required');
      return;
    }
    if (form.salePrice !== undefined && form.salePrice >= form.basePrice) {
      toast.error('Sale price must be less than base price');
      return;
    }

    try {
      const payload: CreateProductPayload = {
        ...form,
        categoryId:       catId || undefined,
        shortDescription: form.shortDescription || undefined,
        fullDescription:  form.fullDescription  || undefined,
      };
      const product   = await createProduct(payload).unwrap();
      const productId = (product as unknown as { id: string }).id;

      // 1 — Set base stock (only when no variants — per-variant stock is set in step 3)
      if (!variantsEnabled && stockQty > 0) {
        await setInventory({ productId, quantity: stockQty }).unwrap().catch(() => {});
      }

      // 2 — Attach general images
      for (let i = 0; i < images.length; i++) {
        await addProductMedia({
          productId,
          url:          images[i].url,
          isPrimary:    images[i].isPrimary,
          mediaType:    'image',
          displayOrder: i,
        }).unwrap().catch(() => {});
      }

      // 3 — Create color variants + attach color images
      for (const cv of colorVariants) {
        if (!cv.name.trim()) continue;
        const variant = await createProductVariant({
          productId,
          name:    cv.name,
          options: { color: cv.name, colorHex: cv.hex },
        }).unwrap().catch(() => null);

        if (variant) {
          for (let i = 0; i < cv.images.length; i++) {
            await addProductMedia({
              productId,
              url:          cv.images[i].url,
              isPrimary:    i === 0,
              mediaType:    'image',
              displayOrder: i,
              variantId:    variant.id,
            }).unwrap().catch(() => {});
          }
        }
      }

      // 4 — Create size variants + their images
      for (const sv of sizeVariants) {
        if (!sv.name.trim()) continue;
        const sizeVariant = await createProductVariant({
          productId,
          name:            sv.name,
          sku:             sv.sku || undefined,
          options:         { size: sv.name },
          additionalPrice: sv.additionalPrice,
          stockQuantity:   sv.stockQuantity,
        }).unwrap().catch(() => null);

        if (sizeVariant) {
          for (let i = 0; i < sv.images.length; i++) {
            await addProductMedia({
              productId,
              url:          sv.images[i].url,
              isPrimary:    i === 0,
              mediaType:    'image',
              displayOrder: i,
              variantId:    sizeVariant.id,
            }).unwrap().catch(() => {});
          }
        }
      }

      toast.success('Product created!');
      router.push('/admin/products');
    } catch (e: unknown) {
      const err = e as { data?: { error?: string; message?: string } };
      toast.error(err.data?.error ?? err.data?.message ?? 'Create failed');
    }
  }

  const isBusy = isLoading || uploading || colorVariants.some((c) => c.uploading) || sizeVariants.some((s) => s.uploading);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">New Product</h1>
      </div>

      {/* ── Basic Info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Basic Info</h2>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Name *</label>
          <input
            value={form.name}
            onChange={(e) => { set('name', e.target.value); if (!form.slug) set('slug', autoSlug(e.target.value)); }}
            placeholder="Product name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => set('slug', autoSlug(e.target.value))}
            placeholder="url-friendly-slug"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Short Description</label>
          <input
            value={form.shortDescription ?? ''}
            onChange={(e) => set('shortDescription', e.target.value)}
            placeholder="One-line summary shown in listings"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Description</label>
          <textarea
            value={form.fullDescription ?? ''}
            onChange={(e) => set('fullDescription', e.target.value)}
            rows={5}
            placeholder="Detailed product description"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
          />
        </div>
      </div>

      {/* ── General Images ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Product Images</h2>
          <p className="text-xs text-gray-500 mt-1">These appear on the product page for all variants. Upload color-specific images in the Variants section below.</p>
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50"
        >
          {uploading
            ? <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-xs">Uploading…</span></>
            : <><ImagePlus className="h-6 w-6" /><span className="text-xs font-medium">Click to upload images (select multiple)</span><span className="text-[11px]">JPG, PNG, WEBP · max 10MB each</span></>
          }
        </button>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div key={img.url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-28 object-cover rounded-xl border border-gray-200" />
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-forest-600 text-white text-[10px] font-bold">Primary</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-2">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => setPrimary(idx)} className="px-2.5 py-1 rounded-lg bg-forest-600 text-white text-[10px] font-semibold hover:bg-forest-700">Set Primary</button>
                  )}
                  <button type="button" onClick={() => removeImage(idx)} className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Variants ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Variants</h2>
            <p className="text-xs text-gray-500 mt-1">Enable if this product comes in multiple sizes, colors, or options.</p>
          </div>
          <button
            type="button"
            onClick={() => setVariantsEnabled((v) => !v)}
            className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${variantsEnabled ? 'bg-forest-600' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={variantsEnabled}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${variantsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {!variantsEnabled && (
          <p className="text-xs text-gray-400 italic">
            Toggle on to add sizes (e.g. 3×6, 4×6) or colors — each with their own price and images.
          </p>
        )}

        {variantsEnabled && (
        <>{/* Tab switcher */}
        <div className="flex gap-2 border-b border-gray-100 pb-0">
          {(['colors', 'sizes'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setVariantTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
                variantTab === tab
                  ? 'border-forest-600 text-forest-700 bg-forest-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'colors' ? <Palette className="h-3.5 w-3.5" /> : <Ruler className="h-3.5 w-3.5" />}
              {tab === 'colors' ? `Colors (${colorVariants.length})` : `Sizes (${sizeVariants.length})`}
            </button>
          ))}
        </div>

        {/* ── Colors tab ── */}
        {variantTab === 'colors' && (
          <div className="space-y-4">
            {colorVariants.map((cv) => (
              <div key={cv.tempId} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {/* Color picker */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-600">Color</label>
                    <input
                      type="color"
                      value={cv.hex}
                      onChange={(e) => updateColor(cv.tempId, { hex: e.target.value })}
                      className="h-8 w-10 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                      title="Pick color"
                    />
                  </div>
                  {/* Name */}
                  <input
                    value={cv.name}
                    onChange={(e) => updateColor(cv.tempId, { name: e.target.value })}
                    placeholder="Color name (e.g. Burgundy)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                  <button type="button" onClick={() => removeColor(cv.tempId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Color images */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images for this color</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={(el) => { colorFileRefs.current[cv.tempId] = el; }}
                    onChange={(e) => handleColorImageUpload(cv.tempId, e)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {cv.images.map((img, imgIdx) => (
                      <div key={img.url} className="relative group w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeColorImage(cv.tempId, imgIdx)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={cv.uploading}
                      onClick={() => colorFileRefs.current[cv.tempId]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50"
                    >
                      {cv.uploading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><ImagePlus className="h-4 w-4" /><span className="text-[10px] mt-0.5">Add</span></>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addColor}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-forest-400 hover:text-forest-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Color
            </button>
          </div>
        )}

        {/* ── Sizes tab ── */}
        {variantTab === 'sizes' && (
          <div className="space-y-4">
            {sizeVariants.length > 0 && (
              <p className="text-xs text-gray-500 px-1">
                Base price: <strong>KES {form.basePrice.toLocaleString()}</strong>. Additional price is added on top. You can also attach images for each size.
              </p>
            )}
            {sizeVariants.map((sv) => (
              <div key={sv.tempId} className="border border-gray-200 rounded-xl p-4 space-y-3">
                {/* Name + price row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    value={sv.name}
                    onChange={(e) => updateSize(sv.tempId, { name: e.target.value })}
                    placeholder="Size name (e.g. 4×6, King Size)"
                    className="flex-1 min-w-[140px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-500">+ KES</span>
                    <input
                      type="number"
                      value={sv.additionalPrice}
                      onChange={(e) => updateSize(sv.tempId, { additionalPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-right"
                    />
                  </div>
                  {form.basePrice > 0 && (
                    <span className="text-xs font-bold text-forest-700 flex-shrink-0">
                      = KES {(form.basePrice + sv.additionalPrice).toLocaleString()}
                    </span>
                  )}
                  <button type="button" onClick={() => removeSize(sv.tempId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {/* SKU + stock row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <input
                      value={sv.sku}
                      onChange={(e) => updateSize(sv.tempId, { sku: e.target.value })}
                      placeholder="SKU (optional)"
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-forest-500 text-gray-600"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-gray-500">Stock</span>
                    <input
                      type="number"
                      value={sv.stockQuantity}
                      onChange={(e) => updateSize(sv.tempId, { stockQuantity: Math.max(0, Number(e.target.value)) })}
                      onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
                      min={0}
                      className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-forest-500 text-right"
                    />
                  </div>
                </div>

                {/* Size images */}
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images for this size <span className="text-gray-400 font-normal">(optional)</span></p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    ref={(el) => { sizeFileRefs.current[sv.tempId] = el; }}
                    onChange={(e) => handleSizeImageUpload(sv.tempId, e)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {sv.images.map((img, imgIdx) => (
                      <div key={img.url} className="relative group w-20 h-20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => removeSizeImage(sv.tempId, imgIdx)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-[10px] font-bold">✕</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={sv.uploading}
                      onClick={() => sizeFileRefs.current[sv.tempId]?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50"
                    >
                      {sv.uploading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><ImagePlus className="h-4 w-4" /><span className="text-[10px] mt-0.5">Add</span></>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSize}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-forest-400 hover:text-forest-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Size
            </button>
          </div>
        )}
        </>)}
      </div>

      {/* ── Pricing & Status ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wider">Pricing & Status</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Base Price (KES) *</label>
            <input
              type="number"
              value={form.basePrice}
              onChange={(e) => set('basePrice', Number(e.target.value))}
              onFocus={(e) => { if (e.target.value === '0') e.target.select(); }}
              min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Sale Price (KES)</label>
            <input
              type="number"
              value={form.salePrice ?? ''}
              onChange={(e) => { const n = Number(e.target.value); set('salePrice', n > 0 ? n : undefined); }}
              min={0}
              placeholder="Leave blank if no sale"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            {form.salePrice !== undefined && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.showSalePrice)}
                  onChange={(e) => set('showSalePrice', e.target.checked)}
                  className="rounded border-gray-300 text-forest-600"
                />
                <span className="text-gray-700">Show sale price &amp; savings badge to customers</span>
              </label>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Status</label>
            <select
              value={form.status ?? 'draft'}
              onChange={(e) => set('status', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
            >
              {['draft', 'active', 'archived', 'out_of_stock'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Low Stock Threshold</label>
            <input
              type="number"
              value={form.stockWarningThreshold ?? 5}
              onChange={(e) => set('stockWarningThreshold', Number(e.target.value))}
              min={0}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
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
              <p className="text-xs text-gray-400 mt-1">How many units you currently have in stock.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          {([['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival']] as [keyof typeof INITIAL, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => set(key, e.target.checked)}
                className="rounded border-gray-300 text-forest-600"
              />
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
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
          >
            <option value="">None</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Type a tag and press Enter"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <button type="button" onClick={addTag} className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">Add</button>
          </div>
          {(form.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(form.tags ?? []).map((t) => (
                <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-medium">
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pb-6">
        <Link href="/admin/products" className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center">
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isBusy}
          className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-forest-900 text-white text-sm font-bold hover:bg-forest-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isLoading ? 'Creating…' : 'Create Product'}
        </button>
      </div>
    </div>
  );
}
