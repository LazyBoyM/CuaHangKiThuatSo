import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import Button from './Button'
import Card from './Card'
import Badge from './Badge'
import toast from 'react-hot-toast'

export default function ReviewSection({ productId, purchased }) {
  const { user, isAuthenticated } = useAuthStore()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0 })

  const fetchReviews = () => {
    setLoading(true)
    Promise.all([
      api.get(`/reviews/product/${productId}`),
      api.get(`/reviews/product/${productId}/rating`)
    ])
      .then(([reviewsRes, ratingRes]) => {
        setReviews(reviewsRes.data || [])
        setStats(ratingRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (productId) {
      fetchReviews()
    }
  }, [productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/reviews', { productId, rating, comment })
      toast.success('Đánh giá thành công!')
      setShowForm(false)
      setRating(5)
      setComment('')
      fetchReviews()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  const canReview = isAuthenticated && purchased && user?.role === 'buyer'

  return (
    <div className="mt-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá sản phẩm</h3>
          <Badge variant="warning">
            {stats.averageRating.toFixed(1)} ★ ({stats.totalReviews})
          </Badge>
        </div>
        {canReview && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            Viết đánh giá
          </Button>
        )}
      </div>

      {/* Form đánh giá */}
      {showForm && (
        <Card padding="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá của bạn
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={submitting} size="sm">
                Gửi đánh giá
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Danh sách đánh giá */}
      {loading ? (
        <p className="text-gray-500 text-sm py-4">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review._id} padding="md" className="bg-gray-50">
              <div className="flex items-start gap-3">
  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-sm font-medium">
    {review.buyer?.name?.charAt(0)?.toUpperCase() || review.buyer?.slice(-4) || 'U'}
  </div>
  <div className="flex-1">
    <div className="flex items-center gap-2">
      <span className="font-medium text-gray-900">
        {review.buyer?.name || `Người dùng #${review.buyer?.slice(-6)}`}
      </span>
                    <span className="text-yellow-400 text-sm">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{review.comment}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}