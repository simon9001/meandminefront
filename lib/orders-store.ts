import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OrderRef {
  orderNumber: string;
  placedAt:    string;
  total:       number;
}

export type DisplayStatus =
  | 'confirmed'
  | 'processing'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<DisplayStatus, string> = {
  confirmed:        'Confirmed',
  processing:       'Processing',
  dispatched:       'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

export const ORDER_STATUS_STEPS: Exclude<DisplayStatus, 'cancelled'>[] = [
  'confirmed',
  'processing',
  'dispatched',
  'out_for_delivery',
  'delivered',
];

export function mapDbStatus(dbStatus: string): DisplayStatus {
  switch (dbStatus) {
    case 'pending':          return 'confirmed';
    case 'confirmed':        return 'confirmed';
    case 'processing':       return 'processing';
    case 'dispatched':       return 'dispatched';
    case 'shipped':          return 'dispatched';
    case 'out_for_delivery': return 'out_for_delivery';
    case 'delivered':        return 'delivered';
    case 'cancelled':        return 'cancelled';
    case 'refunded':         return 'cancelled';
    default:                 return 'confirmed';
  }
}

interface OrdersState {
  orders: OrderRef[];
  addOrderRef: (ref: OrderRef) => void;
  clearOrders:  () => void;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders:      [],
      addOrderRef: (ref) => set((state) => ({ orders: [ref, ...state.orders] })),
      clearOrders:  ()   => set({ orders: [] }),
    }),
    { name: 'maschon-orders' }
  )
);
