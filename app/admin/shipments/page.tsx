'use client';
import { useState } from 'react';
import { Truck, Plus, Loader2, X, MapPin, Package } from 'lucide-react';
import {
  useAdminListOrdersQuery,
  useCreateShipmentMutation,
  useGetShipmentForOrderQuery,
  useAddShipmentEventMutation,
  type Shipment,
} from '@/lib/redux/api/adminApi';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/lib/types';

function ShipmentDetail({ orderId }: { orderId: string }) {
  const { data: shipment, isLoading } = useGetShipmentForOrderQuery(orderId);
  const [createShipment] = useCreateShipmentMutation();
  const [addEvent]       = useAddShipmentEventMutation();
  const [carrier, setCarrier]   = useState('');
  const [tracking, setTracking] = useState('');
  const [eventStatus, setEvSt]  = useState('in_transit');
  const [eventDesc, setEvDesc]  = useState('');
  const [evLocation, setEvLoc]  = useState('');
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState<'info' | 'event'>('info');

  async function handleCreate() {
    setSaving(true);
    try {
      await createShipment({ orderId, carrier, trackingNo: tracking }).unwrap();
      toast.success('Shipment created');
    } catch { toast.error('Failed to create shipment'); }
    finally { setSaving(false); }
  }

  async function handleAddEvent(ship: Shipment) {
    if (!eventDesc.trim()) { toast.error('Description required'); return; }
    setSaving(true);
    try {
      await addEvent({ shipmentId: ship.id, status: eventStatus, description: eventDesc, location: evLocation || undefined }).unwrap();
      toast.success('Tracking event added');
      setEvDesc('');
      setEvLoc('');
    } catch { toast.error('Failed to add event'); }
    finally { setSaving(false); }
  }

  if (isLoading) return <div className="p-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-forest-600" /></div>;

  if (!shipment) {
    return (
      <div className="p-4 space-y-3 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-600">No shipment yet. Create one:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier (e.g. Fargo)" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
        </div>
        <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-xl bg-[#ff7c2a] text-white text-sm font-medium hover:bg-[#e06920] disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Shipment
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-100 space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-500">Carrier: <strong className="text-gray-900">{shipment.carrier ?? '—'}</strong></span>
        <span className="text-gray-500">Tracking: <strong className="text-gray-900 font-mono break-all">{shipment.trackingNo ?? '—'}</strong></span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${shipment.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {shipment.status}
        </span>
      </div>

      <div className="flex gap-2">
        {(['info', 'event'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t === 'info' ? 'Events' : 'Add Event'}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {shipment.events.length === 0 ? (
            <p className="text-xs text-gray-400">No events yet.</p>
          ) : shipment.events.map((ev) => (
            <div key={ev.id} className="flex items-start gap-2 text-xs">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-700">{ev.status.replace(/_/g, ' ')}</p>
                <p className="text-gray-500">{ev.description}{ev.location ? ` — ${ev.location}` : ''}</p>
                <p className="text-gray-300">{new Date(ev.eventTime).toLocaleString('en-KE')}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <select value={eventStatus} onChange={(e) => setEvSt(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white">
            {['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <input value={eventDesc} onChange={(e) => setEvDesc(e.target.value)} placeholder="Event description *" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          <input value={evLocation} onChange={(e) => setEvLoc(e.target.value)} placeholder="Location (optional)" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500" />
          <button onClick={() => handleAddEvent(shipment)} disabled={saving} className="px-4 py-2 rounded-xl bg-[#ff7c2a] text-white text-sm font-medium hover:bg-[#e06920] disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>
      )}
    </div>
  );
}

export default function ShipmentsPage() {
  const [expandedOrder, setExpanded] = useState<string | null>(null);
  const [status, setStatus]         = useState('confirmed');

  const { data, isLoading } = useAdminListOrdersQuery({ status, limit: 50 });
  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Shipments</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
        >
          {['confirmed', 'processing', 'shipped', 'delivered'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-forest-600" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No orders with status &quot;{status}&quot;.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: Order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{new Date(order.placedAt).toLocaleDateString('en-KE')} · {formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded(expandedOrder === order.id ? null : order.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Truck className="h-4 w-4" />
                  {expandedOrder === order.id ? 'Hide' : 'Manage Shipment'}
                </button>
              </div>
              {expandedOrder === order.id && <ShipmentDetail orderId={order.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
