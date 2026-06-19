'use client';
import { useState, useRef } from 'react';
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Image as ImageIcon, Megaphone,
  Loader2, AlertCircle, X, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAdminListAllPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
} from '@/lib/redux/api/promotionsApi';
import type { CreatePromotionPayload } from '@/lib/redux/api/promotionsApi';
import type { Promotion } from '@/lib/types';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');

// ── Types ──────────────────────────────────────────────────────────────────────

const OFFER_BG_OPTIONS = [
  { label: 'Earth (brown)',    value: 'bg-earth-500' },
  { label: 'Earth dark',      value: 'bg-earth-600' },
  { label: 'Red',             value: 'bg-red-500' },
  { label: 'Forest green',    value: 'bg-forest-600' },
  { label: 'Forest dark',     value: 'bg-forest-900' },
  { label: 'Blue',            value: 'bg-blue-600' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function emptyForm(type: 'hero_slide' | 'navbar_banner'): CreatePromotionPayload {
  return {
    type,
    title: '',
    subtitle: '',
    eyebrow: '',
    imageUrl: '',
    offerText: '',
    offerBg: 'bg-earth-500',
    ctaText: type === 'hero_slide' ? 'Shop Now' : 'SHOP NOW',
    ctaUrl: '/products',
    bgColor: 'bg-forest-900',
    tags: [],
    offerBadgeStyle: 'bg-white text-forest-900',
    ctaStyle: 'bg-earth-500 text-white',
    displayOrder: 0,
    isActive: true,
  };
}

function promotionToForm(p: Promotion): CreatePromotionPayload {
  return {
    type:            p.type,
    title:           p.title,
    subtitle:        p.subtitle ?? '',
    eyebrow:         p.eyebrow ?? '',
    imageUrl:        p.imageUrl ?? '',
    offerText:       p.offerText ?? '',
    offerBg:         p.offerBg ?? 'bg-earth-500',
    ctaText:         p.ctaText,
    ctaUrl:          p.ctaUrl,
    bgColor:         p.bgColor ?? '',
    tags:            p.tags,
    offerBadgeStyle: p.offerBadgeStyle ?? '',
    ctaStyle:        p.ctaStyle ?? '',
    displayOrder:    p.displayOrder,
    isActive:        p.isActive,
  };
}

// ── Form Modal ─────────────────────────────────────────────────────────────────

function PromotionFormModal({
  initial,
  editingId,
  onClose,
}: {
  initial: CreatePromotionPayload;
  editingId: string | null;
  onClose: () => void;
}) {
  const [form, setForm]           = useState<CreatePromotionPayload>(initial);
  const [tagsInput, setTagsInput] = useState(initial.tags?.join(', ') ?? '');
  const [uploading, setUploading] = useState(false);
  const fileRef                   = useRef<HTMLInputElement>(null);
  const [createPromotion, { isLoading: creating }] = useCreatePromotionMutation();
  const [updatePromotion, { isLoading: updating }] = useUpdatePromotionMutation();
  const saving = creating || updating;

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/upload/promotion`, {
        method:      'POST',
        credentials: 'include',
        body:        fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? json.message ?? 'Upload failed');
      setField('imageUrl', json.data.url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function setField<K extends keyof CreatePromotionPayload>(
    key: K,
    value: CreatePromotionPayload[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean) };
    try {
      if (editingId) {
        await updatePromotion({ id: editingId, ...payload }).unwrap();
        toast.success('Promotion updated');
      } else {
        await createPromotion(payload).unwrap();
        toast.success('Promotion created');
      }
      onClose();
    } catch {
      toast.error('Failed to save promotion');
    }
  }

  const isHero = form.type === 'hero_slide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            {editingId ? 'Edit' : 'New'} {isHero ? 'Hero Slide' : 'Navbar Banner'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder={isHero ? 'Premium Carpets' : 'Kitchenware Deals'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">CTA Text</label>
              <input
                value={form.ctaText ?? ''}
                onChange={(e) => setField('ctaText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder={isHero ? 'Shop Now' : 'SHOP NOW'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">CTA URL *</label>
              <input
                required
                value={form.ctaUrl}
                onChange={(e) => setField('ctaUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                placeholder="/products?category=carpets"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.displayOrder ?? 0}
                onChange={(e) => setField('displayOrder', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setField('isActive', !form.isActive)}
                  className={cn(
                    'relative w-10 h-6 rounded-full transition-colors',
                    form.isActive ? 'bg-forest-600' : 'bg-gray-200'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.isActive ? 'translate-x-4' : 'translate-x-0'
                  )} />
                </div>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Hero slide specific fields */}
          {isHero && (
            <div className="space-y-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Hero Slide Fields</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Hero Image</label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFile}
                  />

                  {form.imageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl}
                        alt="Promotion preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-semibold hover:bg-gray-100 flex items-center gap-1.5"
                        >
                          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => setField('imageUrl', '')}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 flex items-center gap-1.5"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                    >
                      {uploading
                        ? <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-xs">Uploading…</span></>
                        : <><Upload className="h-6 w-6" /><span className="text-xs font-medium">Click to upload hero image</span><span className="text-[11px]">JPG, PNG, WEBP · max 10MB</span></>
                      }
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Eyebrow (small label)</label>
                  <input
                    value={form.eyebrow ?? ''}
                    onChange={(e) => setField('eyebrow', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="New Collection"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle</label>
                  <input
                    value={form.subtitle ?? ''}
                    onChange={(e) => setField('subtitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="Geometric & abstract styles"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Text</label>
                  <input
                    value={form.offerText ?? ''}
                    onChange={(e) => setField('offerText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="FROM KES 2,500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Badge Color</label>
                  <select
                    value={form.offerBg ?? 'bg-earth-500'}
                    onChange={(e) => setField('offerBg', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
                  >
                    {OFFER_BG_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navbar banner specific fields */}
          {!isHero && (
            <div className="space-y-4 p-4 rounded-xl bg-forest-50 border border-forest-100">
              <p className="text-xs font-bold uppercase tracking-widest text-forest-700">Navbar Banner Fields</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Background Color (CSS class)</label>
                  <input
                    value={form.bgColor ?? ''}
                    onChange={(e) => setField('bgColor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="bg-[#0b7a8a] or bg-forest-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Text</label>
                  <input
                    value={form.offerText ?? ''}
                    onChange={(e) => setField('offerText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="UP TO 40% OFF"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Brand Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
                  </label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="Redberry, Mika, Rashnik, Selven"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Badge CSS Classes</label>
                  <input
                    value={form.offerBadgeStyle ?? ''}
                    onChange={(e) => setField('offerBadgeStyle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="bg-white text-[#0b7a8a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CTA Button CSS Classes</label>
                  <input
                    value={form.ctaStyle ?? ''}
                    onChange={(e) => setField('ctaStyle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="bg-[#f5c518] text-black"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Promotion Row ──────────────────────────────────────────────────────────────

function PromotionRow({
  promo,
  onEdit,
  onDelete,
  onToggle,
  toggling,
  deleting,
}: {
  promo: Promotion;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const isHero = promo.type === 'hero_slide';

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Type icon / thumbnail / color preview */}
      <div className="flex-shrink-0 h-10 w-10 rounded-lg overflow-hidden">
        {isHero && promo.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={promo.imageUrl} alt={promo.title} className="h-full w-full object-cover" />
        ) : (
          <div className={cn(
            'h-full w-full flex items-center justify-center',
            isHero ? 'bg-blue-50' : (promo.bgColor ?? 'bg-forest-900')
          )}>
            {isHero
              ? <ImageIcon className="h-5 w-5 text-blue-500" />
              : <Megaphone className="h-5 w-5 text-white" />}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{promo.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {promo.offerText && (
            <span className="text-xs text-gray-500 truncate">{promo.offerText}</span>
          )}
          {promo.tags && promo.tags.length > 0 && (
            <span className="text-xs text-gray-400 truncate hidden sm:block">
              {promo.tags.slice(0, 2).join(', ')}{promo.tags.length > 2 ? ` +${promo.tags.length - 2}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Order */}
      <span className="hidden sm:block flex-shrink-0 text-xs text-gray-400 w-6 text-center">
        #{promo.displayOrder}
      </span>

      {/* Status + actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={cn(
          'hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full',
          promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          {promo.isActive ? 'Active' : 'Off'}
        </span>

        <button
          onClick={onToggle}
          disabled={toggling}
          title={promo.isActive ? 'Deactivate' : 'Activate'}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40"
        >
          {toggling
            ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            : promo.isActive
              ? <ToggleRight className="h-4 w-4 text-green-500" />
              : <ToggleLeft className="h-4 w-4 text-gray-400" />}
        </button>

        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          title="Edit"
        >
          <Pencil className="h-4 w-4 text-gray-500" />
        </button>

        <button
          onClick={onDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
          title="Delete"
        >
          {deleting
            ? <Loader2 className="h-4 w-4 animate-spin text-red-400" />
            : <Trash2 className="h-4 w-4 text-red-400" />}
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [modalType, setModalType]   = useState<'hero_slide' | 'navbar_banner' | null>(null);
  const [editing,   setEditing]     = useState<Promotion | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: promotions = [], isLoading, isError } = useAdminListAllPromotionsQuery();
  const [updatePromotion] = useUpdatePromotionMutation();
  const [deletePromotion] = useDeletePromotionMutation();

  const heroSlides    = promotions.filter((p) => p.type === 'hero_slide');
  const navbarBanners = promotions.filter((p) => p.type === 'navbar_banner');

  function openCreate(type: 'hero_slide' | 'navbar_banner') {
    setEditing(null);
    setModalType(type);
  }

  function openEdit(promo: Promotion) {
    setEditing(promo);
    setModalType(promo.type);
  }

  function closeModal() {
    setModalType(null);
    setEditing(null);
  }

  async function handleToggle(promo: Promotion) {
    setTogglingId(promo.id);
    try {
      await updatePromotion({ id: promo.id, isActive: !promo.isActive }).unwrap();
      toast.success(promo.isActive ? 'Promotion deactivated' : 'Promotion activated');
    } catch {
      toast.error('Failed to update');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(promo: Promotion) {
    if (!confirm(`Delete "${promo.title}"? This cannot be undone.`)) return;
    setDeletingId(promo.id);
    try {
      await deletePromotion(promo.id).unwrap();
      toast.success('Promotion deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  const modalInitial = editing
    ? promotionToForm(editing)
    : modalType
      ? emptyForm(modalType)
      : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage hero slides and navbar banners shown to customers
          </p>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 mb-6">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Failed to load promotions. Check your connection.</p>
        </div>
      )}

      {/* ── Hero Slides ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold text-gray-900">Hero Slides</h2>
            <span className="text-xs text-gray-400">({heroSlides.length})</span>
          </div>
          <button
            onClick={() => openCreate('hero_slide')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Hero Slide
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : heroSlides.length === 0 ? (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200">
            <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No hero slides yet</p>
            <button
              onClick={() => openCreate('hero_slide')}
              className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
            >
              Add your first slide
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {heroSlides.map((p) => (
              <PromotionRow
                key={p.id}
                promo={p}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p)}
                onToggle={() => handleToggle(p)}
                toggling={togglingId === p.id}
                deleting={deletingId === p.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Navbar Banners ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-forest-600" />
            <h2 className="text-sm font-bold text-gray-900">Navbar Banners</h2>
            <span className="text-xs text-gray-400">({navbarBanners.length})</span>
          </div>
          <button
            onClick={() => openCreate('navbar_banner')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-forest-700 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add Banner
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : navbarBanners.length === 0 ? (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200">
            <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No navbar banners yet</p>
            <button
              onClick={() => openCreate('navbar_banner')}
              className="mt-2 text-xs text-forest-600 font-semibold hover:underline"
            >
              Add your first banner
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {navbarBanners.map((p) => (
              <PromotionRow
                key={p.id}
                promo={p}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p)}
                onToggle={() => handleToggle(p)}
                toggling={togglingId === p.id}
                deleting={deletingId === p.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {modalType && modalInitial && (
        <PromotionFormModal
          initial={modalInitial}
          editingId={editing?.id ?? null}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
