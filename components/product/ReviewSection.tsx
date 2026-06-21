'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listProductReviews, createReview, voteReview } from '@/lib/api/products';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { ThumbsUp, ThumbsDown, CheckCircle, Loader2, ChevronDown } from 'lucide-react';
import { useAppSelector } from '@/lib/redux/hooks';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { toast } from 'sonner';

interface Props { productId: string; averageRating: number; reviewCount: number; }

export function ReviewSection({ productId, averageRating, reviewCount }: Props) {
  const user = useAppSelector(selectCurrentUser);
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId, page],
    queryFn: () => listProductReviews(productId, { page, limit: 5 }),
  });

  const submitMutation = useMutation({
    mutationFn: () => createReview({ productId, ...form }),
    onSuccess: () => {
      toast.success('Review submitted! It will appear after moderation.');
      qc.invalidateQueries({ queryKey: ['reviews', productId] });
      setWriting(false);
      setForm({ rating: 5, title: '', body: '' });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voteMutation = useMutation({
    mutationFn: ({ id, vote }: { id: string; vote: 'helpful' | 'not_helpful' }) => voteReview(id, vote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews', productId] }),
  });

  const reviews = data?.data ?? [];
  const meta = data?.meta;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: reviews.filter((rv) => rv.rating === r).length,
    pct: reviewCount ? Math.round((reviews.filter((rv) => rv.rating === r).length / reviewCount) * 100) : 0,
  }));

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Customer Reviews ({reviewCount})</h2>
        {user && !writing && (
          <button onClick={() => setWriting(true)} className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
            Write a Review
          </button>
        )}
      </div>

      {/* Rating summary */}
      <div className="flex gap-8 items-center p-6 bg-gray-50 rounded-2xl">
        <div className="text-center">
          <p className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
          <StarRating rating={averageRating} size="md" className="mt-1 justify-center" />
          <p className="text-xs text-gray-500 mt-1">{reviewCount} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {ratingBreakdown.map(({ r, pct }) => (
            <div key={r} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-4">{r}</span>
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-8">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write review form */}
      {writing && (
        <div className="border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Share Your Experience</h3>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Rating</label>
            <StarRating rating={form.rating} size="lg" interactive onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
          </div>
          <input
            type="text"
            placeholder="Review title (optional)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <textarea
            placeholder="Tell others about your experience…"
            rows={4}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={() => submitMutation.mutate()} disabled={!form.body || submitMutation.isPending} className="px-5 py-2 rounded-xl bg-[#ff7c2a] text-white text-sm font-medium hover:bg-[#e06920] transition-colors disabled:opacity-50 flex items-center gap-2">
              {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Review
            </button>
            <button onClick={() => setWriting(false)} className="px-5 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
        ))}</div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No reviews yet. Be the first to share your experience!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border border-gray-100 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">
                      {r.user_profiles?.firstName ?? 'Customer'} {r.user_profiles?.lastName?.[0] ?? ''}.
                    </p>
                    {r.isVerifiedPurchase && (
                      <Badge variant="success" size="sm"><CheckCircle className="h-3 w-3" /> Verified Purchase</Badge>
                    )}
                  </div>
                  <StarRating rating={r.rating} size="sm" className="mt-0.5" />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(r.createdAt)}</span>
              </div>
              {r.title && <p className="font-semibold text-gray-900 text-sm">{r.title}</p>}
              <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Helpful?</span>
                <button onClick={() => voteMutation.mutate({ id: r.id, vote: 'helpful' })} className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                  <ThumbsUp className="h-3.5 w-3.5" /> {r.helpfulCount}
                </button>
                <button onClick={() => voteMutation.mutate({ id: r.id, vote: 'not_helpful' })} className="flex items-center gap-1 hover:text-red-500 transition-colors">
                  <ThumbsDown className="h-3.5 w-3.5" /> {r.notHelpfulCount}
                </button>
              </div>
            </div>
          ))}

          {meta && meta.totalPages > page && (
            <button onClick={() => setPage((p) => p + 1)} className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <ChevronDown className="h-4 w-4" /> Load more reviews
            </button>
          )}
        </div>
      )}
    </section>
  );
}
