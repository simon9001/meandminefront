// ─── Shared enums ─────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'admin' | 'superadmin' | 'supplier_rep';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'initiated' | 'paid' | 'failed' | 'refunded';
export type ProductStatus = 'draft' | 'active' | 'archived' | 'out_of_stock';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface ProductMedia {
  id: string;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  mediaType: 'image' | 'video' | '360_view';
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string>;
  additionalPrice: number;
  isActive: boolean;
  sku?: string;
}

export interface TrustBadge {
  id: string;
  title: string;
  description?: string;
  iconUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  basePrice: number;
  salePrice?: number;
  showSalePrice?: boolean;
  currency: string;
  status: ProductStatus;
  primaryImageUrl?: string;
  averageRating: number;
  reviewCount: number;
  orderCount: number;
  stockWarningThreshold: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  media?: ProductMedia[];
  variants?: ProductVariant[];
  trustBadges?: TrustBadge[];
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string };
  tags?: string[];
}

// ─── Promotion ────────────────────────────────────────────────────────────────

export interface Promotion {
  id: string;
  type: 'hero_slide' | 'navbar_banner';
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl?: string;
  offerText?: string;
  offerBg?: string;
  ctaText: string;
  ctaUrl: string;
  bgColor?: string;
  tags: string[];
  offerBadgeStyle?: string;
  ctaStyle?: string;
  displayOrder: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Supplier / Supply ────────────────────────────────────────────────────────

export interface SupplierComparison {
  supplyId: string;
  supplierId: string;
  supplierName: string;
  supplierPrice: number;
  salePrice: number;
  profitMargin: number;
  currency: string;
  leadTimeDays?: number;
  minOrderQty: number;
  isPreferred: boolean;
  status: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface Inventory {
  productId: string;
  variantId?: string;
  availableStock: number;
  totalStock: number;
  reservedStock: number;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  supplyId?: string;
  quantity: number;
  unitPrice: number;
  products: Pick<Product, 'id' | 'name' | 'slug' | 'basePrice' | 'salePrice' | 'status' | 'primaryImageUrl'> & { primary_image_url?: string };
  product_variants?: Pick<ProductVariant, 'id' | 'name' | 'options' | 'additionalPrice'>;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  subtotal: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  variantOptions?: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fulfillmentStatus: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  placedAt: string;
  deliveredAt?: string;
  shippingAddress?: Record<string, string>;
  customerNote?: string;
  orderItems?: OrderItem[];
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  userId: string;
  rating: number;
  title?: string;
  body: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
  user_profiles?: { firstName: string; lastName: string };
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  label?: string;
  recipientName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county?: string;
  postalCode?: string;
  countryCode: string;
  isDefault: boolean;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  iconUrl?: string;
  parentId?: string;
  depthLevel: number;
  children?: Category[];
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  orders: { total: number; pending: number; shipped: number; delivered: number };
  products: { total: number; active: number; archived: number };
  users: { total: number };
  revenue30d: number;
}

export interface DailyRevenue {
  revenueDate: string;
  totalRevenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export interface CheckoutItem {
  productId: string;
  variantId?: string;
  supplyId?: string;
  quantity: number;
}

export interface PaystackReference {
  reference: string;
  trans: string;
  status: string;
  message: string;
  transaction: string;
  trxref: string;
}
