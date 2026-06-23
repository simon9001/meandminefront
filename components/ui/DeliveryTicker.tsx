'use client';

const ROW1 = [
  { icon: '🚚', label: 'Free Delivery', sub: 'Orders KES 3,000+' },
  { icon: '📦', label: 'Nationwide Shipping', sub: '2–4 Business Days' },
  { icon: '🛡️', label: '7-Day Returns', sub: 'Quality Guaranteed' },
  { icon: '✅', label: 'Genuine Products', sub: 'Verified Suppliers' },
  { icon: '⚡', label: 'Same-Day Nairobi', sub: 'Order before 12 noon' },
];

const ROW2 = [
  { icon: '💳', label: 'M-Pesa Accepted', sub: 'Instant confirmation' },
  { icon: '🔒', label: 'Secure Checkout', sub: 'Paystack encrypted' },
  { icon: '📲', label: 'WhatsApp Orders', sub: 'Chat with us anytime' },
  { icon: '🏷️', label: 'Best Prices', sub: "Kenya's #1 home store" },
  { icon: '🎁', label: 'Gift Packaging', sub: 'Available on request' },
];

function TickerRow({ items, duration }: { items: typeof ROW1; duration: string }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className="flex"
        style={{ animation: `marquee ${duration} linear infinite`, willChange: 'transform' }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center gap-2 px-6 py-2 border-r border-bark-100"
            style={{ minWidth: 'max-content' }}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <div>
              <p className="text-[11px] font-black text-forest-900 whitespace-nowrap leading-tight">{item.label}</p>
              <p className="text-[10px] text-bark-500 whitespace-nowrap leading-tight">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeliveryTicker() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #fdf8f0 0%, #f5ece0 100%)',
        border: '1px solid rgba(196,123,42,0.15)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ borderBottom: '1px solid rgba(196,123,42,0.1)' }}>
        <TickerRow items={ROW1} duration="28s" />
      </div>
      <TickerRow items={ROW2} duration="22s" />
    </div>
  );
}
