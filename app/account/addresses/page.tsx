'use client';
import { useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Loader2, Star, X, Check } from 'lucide-react';
import {
  useListAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '@/lib/redux/api/usersApi';
import type { Address } from '@/lib/types';
import { toast } from 'sonner';

const EMPTY: Omit<Address, 'id'> = {
  label:         '',
  recipientName: '',
  phone:         '',
  addressLine1:  '',
  addressLine2:  '',
  city:          'Nairobi',
  county:        '',
  postalCode:    '',
  countryCode:   'KE',
  isDefault:     false,
};

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useListAddressesQuery();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Address | null>(null);
  const [form, setForm]           = useState<Omit<Address, 'id'>>(EMPTY);
  const [saving, setSaving]       = useState(false);

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(a: Address) {
    setEditing(a);
    setForm({ label: a.label ?? '', recipientName: a.recipientName, phone: a.phone ?? '', addressLine1: a.addressLine1, addressLine2: a.addressLine2 ?? '', city: a.city, county: a.county ?? '', postalCode: a.postalCode ?? '', countryCode: a.countryCode, isDefault: a.isDefault });
    setShowForm(true);
  }
  function close() { setShowForm(false); setEditing(null); setForm(EMPTY); }

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.recipientName.trim() || !form.addressLine1.trim() || !form.city.trim()) {
      toast.error('Name, address, and city are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateAddress({ addressId: editing.id, ...form }).unwrap();
        toast.success('Address updated');
      } else {
        await createAddress(form).unwrap();
        toast.success('Address added');
      }
      close();
    } catch {
      toast.error('Save failed');
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this address?')) return;
    try { await deleteAddress(id).unwrap(); toast.success('Address deleted'); }
    catch { toast.error('Delete failed'); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Delivery Addresses</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff7c2a] text-white text-sm font-semibold hover:bg-[#e06920] transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Address
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Address' : 'New Address'}</h2>
              <button onClick={close} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Label</label>
                <input value={form.label ?? ''} onChange={(e) => set('label', e.target.value)} placeholder="Home / Office" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => set('isDefault', e.target.checked)} className="rounded border-gray-300 text-emerald-600" />
                  Default address
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Recipient Name *</label>
                <input value={form.recipientName} onChange={(e) => set('recipientName', e.target.value)} placeholder="Full name" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                <input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="07XX XXX XXX" type="tel" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Address Line 1 *</label>
                <input value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} placeholder="Street, building, estate" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Address Line 2</label>
                <input value={form.addressLine2 ?? ''} onChange={(e) => set('addressLine2', e.target.value)} placeholder="Apartment, floor (optional)" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">City *</label>
                <input value={form.city} onChange={(e) => set('city', e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">County</label>
                <input value={form.county ?? ''} onChange={(e) => set('county', e.target.value)} placeholder="e.g. Nairobi" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#ff7c2a] text-white text-sm font-semibold hover:bg-[#e06920] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <MapPin className="h-12 w-12 text-gray-200 mx-auto" />
          <p className="text-gray-400">No addresses yet. Add your first delivery address.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {address.label && <p className="font-semibold text-gray-900 text-sm">{address.label}</p>}
                      {address.isDefault && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          <Star className="h-2.5 w-2.5" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{address.recipientName}</p>
                    {address.phone && <p className="text-sm text-gray-500">{address.phone}</p>}
                    <p className="text-sm text-gray-600">{address.addressLine1}</p>
                    {address.addressLine2 && <p className="text-sm text-gray-600">{address.addressLine2}</p>}
                    <p className="text-sm text-gray-600">{address.city}{address.county ? `, ${address.county}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(address)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(address.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
