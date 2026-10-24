import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import toast from 'react-hot-toast'
import { FiHeart, FiStar } from 'react-icons/fi'

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuthStore()
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [rating, setRating] = useState({ averageRating: 0, totalReviews: 0 })

  useEffect(() => {
    if (isAuthenticated) {
      api.get(`/products/${product._id}/wishlist`)
        .then(res => setInWishlist(res.data.inWishlist))
        .catch(() => {})
      
      api.get(`/orders/check/${product._id}`)
        .then(res => setPurchased(res.data.purchased))
        .catch(() => {})
    }
    api.get(`/reviews/product/${product._id}/rating`)
      .then(res => setRating(res.data))
      .catch(() => {})
  }, [isAuthenticated, product._id])

  const toggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập')
      return
    }
    setLoading(true)
    try {
      const res = await api.post(`/products/${product._id}/wishlist`)
      setInWishlist(res.data.inWishlist)
      toast.success(res.data.message)
    } catch {
      toast.error('Không thể thực hiện')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative group">
      <Link to={`/product/${product._id}`} className="block">
        <div className="card-apple h-full flex flex-col overflow-hidden bg-white">
          {/* Image Container */}
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
            <img
              src={product.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Discount Badge */}
            {product.discount > 0 && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg uppercase tracking-wider">
                -{product.discount}%
              </div>
            )}

            {/* Category Tag */}
            <div className="absolute bottom-4 left-4 px-2 py-1 glass rounded-lg text-[9px] font-bold text-gray-800 uppercase tracking-widest">
              {product.category || 'Digital'}
            </div>

            {/* Subtle Watermark */}
            {!purchased && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="transform -rotate-12 bg-white/30 backdrop-blur-[3px] text-black text-3xl font-black tracking-widest border-y-2 border-black/50 px-6 opacity-50 shadow-lg">
                  MARKETHUB
                </span>
              </div>
            )}



          </div>

          {/* Content */}
          <div className="p-5 flex flex-col flex-grow space-y-2">
            <div className="flex items-center gap-1">
              <FiStar className="text-orange-400 fill-orange-400" size={12} />
              <span className="text-[11px] font-bold text-gray-500">
                {rating.averageRating?.toFixed(1) || '0.0'} ({rating.totalReviews || 0})
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight min-h-[2.5rem]">
              {product.title}
            </h3>

            <div className="pt-2 mt-auto flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {product.price?.toLocaleString('vi-VN')}đ
                </span>
                {product.oldPrice && (
                  <span className="text-sm text-gray-400 line-through">
                    {product.oldPrice?.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
              
              {product.seller && (
                <span className="text-[10px] text-gray-400 mt-1">
                  Bởi <span className="text-gray-600 font-medium">{product.seller.name || 'Shop'}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
      
      {/* Wishlist Button */}
      <button
        onClick={toggleWishlist}
        disabled={loading}
        className={`absolute top-4 right-4 w-9 h-9 glass rounded-full shadow-apple-sm flex items-center justify-center transition-all duration-300 z-10 active:scale-90 ${
          inWishlist ? 'bg-red-50 text-red-500 border-red-100' : 'text-gray-400 hover:text-gray-900 hover:bg-white'
        }`}
      >
        <FiHeart className={inWishlist ? 'fill-current' : ''} size={18} />
      </button>
    </div>
  )
}