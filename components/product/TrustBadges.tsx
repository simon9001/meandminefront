import { ShieldCheck, RefreshCcw, Truck, Award, Lock, Phone } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, title: '100% Authentic', desc: 'Genuine products guaranteed' },
  { icon: Lock,        title: 'Secure Checkout', desc: 'SSL & Paystack encrypted' },
  { icon: Truck,       title: 'Fast Delivery',   desc: 'Nairobi & nationwide' },
  { icon: RefreshCcw,  title: 'Easy Returns',    desc: '7-day return policy' },
  { icon: Award,       title: 'Quality Promise', desc: '100% satisfaction or refund' },
  { icon: Phone,       title: '24/7 Support',    desc: 'We\'re always here for you' },
];

interface Props { compact?: boolean; }

export function TrustBadges({ compact }: Props) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {BADGES.slice(0, 4).map((b) => (
          <div key={b.title} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <b.icon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-700">{b.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6 border-y border-gray-100">
      {BADGES.map((b) => (
        <div key={b.title} className="flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <b.icon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{b.title}</p>
            <p className="text-xs text-gray-500">{b.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
