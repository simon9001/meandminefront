'use client';
import { useEffect, useState } from 'react';
import { Flame, Clock, Users } from 'lucide-react';

interface Props {
  availableStock?: number;
  warningThreshold?: number;
}

export function UrgencyBadge({ availableStock, warningThreshold = 10 }: Props) {
  const [viewers] = useState(() => Math.floor(Math.random() * 20) + 5);
  const [timeLeft, setTimeLeft] = useState(3600);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const isLow = availableStock !== undefined && availableStock <= warningThreshold;
  const isCritical = availableStock !== undefined && availableStock <= 3;

  return (
    <div className="space-y-2">
      {/* Stock level */}
      {isLow && availableStock !== undefined && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${isCritical ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <Flame className={`h-4 w-4 flex-shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
          <span className={`text-sm font-semibold ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
            {isCritical ? `⚠️ Only ${availableStock} left in stock — order soon!` : `Hurry! Only ${availableStock} items remaining`}
          </span>
        </div>
      )}

      {/* Limited time deal */}
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
        <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span className="text-sm font-semibold text-emerald-700">
          Deal ends in <span className="tabular-nums">{mm}:{ss}</span>
        </span>
      </div>

      {/* Social proof */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="h-4 w-4" />
        <span><strong>{viewers}</strong> people viewing this right now</span>
      </div>
    </div>
  );
}
