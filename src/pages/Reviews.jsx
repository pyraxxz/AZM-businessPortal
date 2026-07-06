/**
 * Reviews — Review management and story promotion.
 * View customer reviews, rating distribution, and promote reviews to Stories.
 *
 * Sentry-inspired: widget-based stats, data-dense list, clean cards.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviews as reviewsApi } from '@/lib/marketplaceApi';
import { Widget, WidgetStat } from '@/components/ui/Widget';
import { Button, Badge, Skeleton, Empty } from '@/components/ui';
import { fmt, relativeTime, cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Star, ThumbsUp, MessageSquare, TrendingUp, Sparkles,
  Share2, ChevronLeft, ChevronRight,
} from 'lucide-react';

export default function Reviews() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [ratingFilter, setRatingFilter] = useState('all');

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['biz-reviews', page, ratingFilter],
    queryFn: () => reviewsApi.list({ 
      limit: 10, 
      offset: page * 10,
      minRating: ratingFilter !== 'all' ? ratingFilter : undefined,
    }),
  });
  const reviews = reviewsData?.reviews || [];

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['review-stats'],
    queryFn: () => reviewsApi.stats(),
  });
  const stats = statsData?.stats || {};

  const promoteMut = useMutation({
    mutationFn: (reviewId) => reviewsApi.promoteToStory(reviewId),
    onSuccess: () => {
      toast.success('Review promoted to Story!');
      qc.invalidateQueries(['biz-reviews']);
    },
    onError: (e) => toast.error(e.message),
  });

  const distribution = [
    { stars: 5, count: stats.five || 0, pct: 0 },
    { stars: 4, count: stats.four || 0, pct: 0 },
    { stars: 3, count: stats.three || 0, pct: 0 },
    { stars: 2, count: stats.two || 0, pct: 0 },
    { stars: 1, count: stats.one || 0, pct: 0 },
  ];
  const totalReviews = distribution.reduce((s, d) => s + d.count, 0);
  distribution.forEach(d => d.pct = totalReviews > 0 ? (d.count / totalReviews) * 100 : 0);

  const avgRating = stats.avgRating || 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--sn-text)] flex items-center gap-2">
          <Star className="w-5 h-5 text-[var(--sn-amber)]" />
          Reviews
        </h1>
        <p className="text-sm text-[var(--sn-text-muted)] mt-1">Monitor customer feedback and promote great reviews to Stories.</p>
      </div>

      {/* Stats + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Average rating */}
        <Widget title="Average Rating" icon={Star} iconColor="var(--sn-amber)" loading={statsLoading}>
          <div className="flex items-center gap-3">
            <WidgetStat value={fmt(avgRating, 1)} color="var(--sn-amber)" />
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={cn('w-4 h-4', s <= Math.round(avgRating) ? 'text-[var(--sn-amber)] fill-[var(--sn-amber)]' : 'text-[var(--sn-border)]')}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[var(--sn-text-muted)] mt-2">{totalReviews} total reviews</p>
        </Widget>

        {/* Total reviews */}
        <Widget title="Total Reviews" icon={MessageSquare} iconColor="var(--sn-blue)" loading={statsLoading}>
          <WidgetStat value={fmt(totalReviews, 0)} label="All time" color="var(--sn-blue)" />
        </Widget>

        {/* Stories promoted */}
        <Widget title="Stories Promoted" icon={Sparkles} iconColor="var(--sn-purple)" loading={statsLoading}>
          <WidgetStat value={fmt(stats.storiesPromoted || 0, 0)} label="From reviews" color="var(--sn-purple)" />
        </Widget>
      </div>

      {/* Rating distribution */}
      <Widget title="Rating Distribution" icon={TrendingUp} iconColor="var(--sn-purple)">
        <div className="space-y-2">
          {distribution.map(d => (
            <div key={d.stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-xs font-bold text-[var(--sn-text)]">{d.stars}</span>
                <Star className="w-3 h-3 text-[var(--sn-amber)] fill-[var(--sn-amber)]" />
              </div>
              <div className="flex-1 h-2 rounded-full bg-[var(--sn-border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--sn-amber)] transition-all duration-500"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="text-xs text-[var(--sn-text-muted)] font-medium w-12 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </Widget>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setRatingFilter('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            ratingFilter === 'all' ? 'bg-[var(--sn-amber)] text-[var(--sn-amber)] border border-[#f59e0b30]' : 'text-[var(--sn-text-muted)] hover:bg-[var(--sn-card)] border border-transparent'
          )}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map(r => (
          <button
            key={r}
            onClick={() => setRatingFilter(String(r))}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              ratingFilter === String(r) ? 'bg-[var(--sn-amber)] text-[var(--sn-amber)] border border-[#f59e0b30]' : 'text-[var(--sn-text-muted)] hover:bg-[var(--sn-card)] border border-transparent'
            )}
          >
            {r} <Star className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : reviews.length === 0 ? (
        <Widget title="Reviews" icon={MessageSquare} iconColor="var(--sn-blue)">
          <Empty
            icon={Star}
            title="No reviews yet"
            description="Customer reviews will appear here once your business starts receiving feedback."
          />
        </Widget>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} onPromote={() => promoteMut.mutate(review.id)} promoting={promoteMut.isPending} />
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg text-[var(--sn-text-muted)] hover:bg-[var(--sn-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[var(--sn-text-muted)] font-medium">Page {page + 1}</span>
            <button
              disabled={reviews.length < 10}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg text-[var(--sn-text-muted)] hover:bg-[var(--sn-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, onPromote, promoting }) {
  return (
    <div className="rounded-2xl border border-[var(--sn-border)] p-5 hover:border-[var(--sn-border)] transition-colors" style={{ background: 'var(--az-card)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-full bg-[var(--sn-amber)] border border-[#f59e0b30] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[var(--sn-amber)]">
              {(review.customerName || review.azamanId || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[var(--sn-text)] truncate">{review.customerName || 'Anonymous'}</p>
              <span className="text-[10px] text-[var(--sn-text-muted)]">{review.azamanId}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    className={cn('w-3 h-3', s <= review.rating ? 'text-[var(--sn-amber)] fill-[var(--sn-amber)]' : 'text-[var(--sn-border)]')}
                  />
                ))}
              </div>
              <span className="text-[11px] text-[var(--sn-text-muted)]">{relativeTime(review.createdAt)}</span>
            </div>
            {review.comment && (
              <p className="text-sm text-[var(--sn-text-muted)] mt-2 leading-relaxed">{review.comment}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {review.hasOrderRef && <Badge color="var(--sn-blue)">Verified</Badge>}
          <Button
            size="sm"
            variant="outline"
            onClick={onPromote}
            loading={promoting}
          >
            <Share2 className="w-3 h-3" /> Share as Story
          </Button>
        </div>
      </div>
    </div>
  );
}
