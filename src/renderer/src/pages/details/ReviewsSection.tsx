import type { Reviews } from './types'

interface ReviewsSectionProps {
  reviews: Reviews | null
  loading: boolean
}

export function ReviewsSection({
  reviews,
  loading
}: ReviewsSectionProps): React.JSX.Element | null {
  if (!reviews?.results) return null

  return (
    <div>
      <h3 className="section-title">User Reviews</h3>
      {loading && <div className="loading-text">Loading reviews...</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {reviews.results.slice(0, 2).map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="review-avatar">{review.author[0].toUpperCase()}</div>
              <div>
                <div className="review-author-name">{review.author}</div>
                <div className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              {review.author_details.rating && (
                <div className="review-rating">⭐ {review.author_details.rating}</div>
              )}
            </div>
            <div className="review-content">{review.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
