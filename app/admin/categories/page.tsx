'use client';
import { useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, Check, ImagePlus } from 'lucide-react';
import {
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/lib/redux/api/adminApi';
import type { Category } from '@/lib/types';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/$/, '');
const EMPTY = { name: '', slug: '', description: '', imageUrl: '', parentId: '' };

export default function CategoriesPage() {
  const { data: cats = [], isLoading } = useAdminListCategoriesQuery();
  const [createCat]  = useCreateCategoryMutation();
  const [updateCat]  = useUpdateCategoryMutation();
  const [deleteCat]  = useDeleteCategoryMutation();

  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Category | null>(null);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', imageUrl: c.imageUrl ?? '', parentId: c.parentId ?? '' });
    setShowForm(true);
  }
  function close() { setShowForm(false); setEditing(null); setForm(EMPTY); }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const res = await fetch(`${API}/upload/category`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setForm((f) => ({ ...f, imageUrl: json.data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error((err as Error).message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) { toast.error('Name and slug are required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        imageUrl:  form.imageUrl  || undefined,
        parentId:  form.parentId  || undefined,
        description: form.description || undefined,
      };
      if (editing) {
        await updateCat({ id: editing.id, ...payload }).unwrap();
        toast.success('Category updated');
      } else {
        await createCat(payload).unwrap();
        toast.success('Category created');
      }
      close();
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } }).data?.message ?? 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await deleteCat(id).unwrap(); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>

            {[
              { key: 'name',        label: 'Name *',      placeholder: 'e.g. Carpets' },
              { key: 'slug',        label: 'Slug *',      placeholder: 'e.g. carpets' },
              { key: 'description', label: 'Description', placeholder: 'Optional description' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => ({
                      ...f,
                      [key]: val,
                      ...(key === 'name' && !editing ? { slug: autoSlug(val) } : {}),
                    }));
                  }}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>
            ))}

            {/* Image upload */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Category Image</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {form.imageUrl ? (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Category"
                    className="w-full h-36 object-cover rounded-xl border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-semibold hover:bg-gray-100 transition-colors"
                    >
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" /> : null}
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-forest-400 hover:text-forest-600 transition-colors disabled:opacity-50"
                >
                  {uploading
                    ? <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-xs">Uploading…</span></>
                    : <><ImagePlus className="h-6 w-6" /><span className="text-xs font-medium">Click to upload image</span><span className="text-[11px]">JPG, PNG, WEBP · max 10MB</span></>
                  }
                </button>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Parent Category</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
              >
                <option value="">None (top level)</option>
                {cats.filter((c) => c.id !== editing?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-forest-900 text-white text-sm font-semibold hover:bg-forest-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>
      ) : cats.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No categories yet. Click &quot;Add Category&quot; to create one.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold w-12 hidden sm:table-cell">Image</th>
                <th className="text-left px-5 py-3 font-semibold">Name</th>
                <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Slug</th>
                <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">Level</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="h-9 w-9 rounded-lg object-cover border border-gray-100" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ImagePlus className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">{c.slug}</td>
                  <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs">L{c.depthLevel}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
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
