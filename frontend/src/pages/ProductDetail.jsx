import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import Button from '../components/Button'
import Select from '../components/Select'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import ReviewSection from '../components/ReviewSection'
import { FiChevronLeft, FiShare2, FiHeart, FiExternalLink, FiDownload, FiMessageCircle, FiCheckCircle } from 'react-icons/fi'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponValid, setCouponValid] = useState(null)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [purchased, setPurchased] = useState(false)
  const [currentImage, setCurrentImage] = useState(0)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const isAdmin = user?.role === 'admin'
  const isSeller = user?.role === 'seller'
  const isOwnProduct = product && user && (
    product.seller === user._id || 
    product.seller?._id === user._id || 
    product.seller?.toString() === user._id?.toString()
  )

  const fetchProduct = () => {
    if (!id || id === 'undefined') return
    api.get(`/products/${id}`).then(res => {
      setProduct(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const checkPurchaseStatus = async () => {
    if (!isAuthenticated || isAdmin || !id) return
    try {
      const res = await api.get(`/orders/check/${id}`)
      setPurchased(res.data.purchased)
    } catch {
      setPurchased(false)
    }
  }

  const fetchCoupons = () => {
    if (!isAuthenticated || isAdmin || !id) return
    api.get(`/coupons/available?productId=${id}`)
      .then(res => setAvailableCoupons(res.data || []))
      .catch(() => setAvailableCoupons([]))
  }

  useEffect(() => {
    fetchProduct()
  }, [id])

  useEffect(() => {
    checkPurchaseStatus()
    fetchCoupons()
  }, [isAuthenticated, isAdmin, id])

  const couponOptions = [
    { value: '', label: 'Chọn mã giảm giá' },
    ...availableCoupons.map(c => ({
      value: c.code,
      label: `${c.code} (-${c.discountPercent}%)`
    }))
  ]

  const handleCouponChange = async (e) => {
    const code = e.target.value
    setCouponCode(code)
    if (!code) {
      setCouponValid(null)
      return
    }
    try {
      const res = await api.post('/coupons/validate', { code, productId: id })
      setCouponValid(res.data)
    } catch {
      setCouponValid(null)
      toast.error('Mã giảm giá không hợp lệ')
    }
  }

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isAdmin || isSeller) {
      toast.error('Tài khoản này không thể mua hàng')
      return
    }
    if (isOwnProduct) {
      toast.error('Bạn không thể mua sản phẩm của chính mình')
      return
    }
    setBuying(true)
    try {
      const payload = { productId: id }
      if (couponValid) payload.couponCode = couponCode
      
      const res = await api.post('/payments/create-momo', payload)
      window.location.href = res.data.payUrl
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo thanh toán')
      setBuying(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!product) return (
    <div className="text-center py-24 container-custom">
      <p className="text-gray-400 mb-6 text-lg">Không tìm thấy sản phẩm này</p>
      <Link to="/shop" className="btn-apple-primary">Quay lại cửa hàng</Link>
    </div>
  )

  const discountedPrice = couponValid 
    ? product.price * (1 - couponValid.discountPercent / 100)
    : product.price

  const canBuy = isAuthenticated && !isAdmin && !isSeller && !isOwnProduct && !purchased
  const sellerId = product.seller?._id || product.seller
  const allImages = product.images?.length ? product.images : [product.thumbnail].filter(Boolean)

  return (
    <div className="container-custom pb-24">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
          <FiChevronLeft /> Quay lại
        </button>
        <div className="flex gap-2">
          <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-gray-600 hover:text-black transition-all active:scale-90">
            <FiShare2 size={18} />
          </button>
          <button className="w-10 h-10 glass rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-all active:scale-90">
            <FiHeart size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Gallery Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] bg-white rounded-[32px] overflow-hidden shadow-apple-lg border border-gray-100/50 group relative">
            <img 
              src={allImages[currentImage] || 'https://via.placeholder.com/800x600'} 
              alt={product.title} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            {/* Watermark Section */}
            {!purchased && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-16 opacity-60">
                  <div className="transform -rotate-12 bg-white/40 backdrop-blur-md text-black text-7xl font-black tracking-[0.25em] border-y-[6px] border-black py-10 px-24 shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                    MARKETHUB
                  </div>
                  <div className="transform -rotate-12 bg-black/20 text-black text-5xl font-extrabold tracking-[0.2em] px-12 py-4 rounded-full border-2 border-black/30">
                    DIGITAL PREVIEW
                  </div>
                </div>
              </div>
            )}



          </div>
          
          {allImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentImage(i)} 
                  className={`w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-300 border-2 ${
                    i === currentImage ? 'border-blue-500 scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Chi tiết sản phẩm</h2>
            <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        </div>

        {/* Info & Purchase Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="sticky top-28 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 glass rounded-full text-xs font-bold text-blue-600 uppercase tracking-widest">
                  {product.category || 'Digital'}
                </span>
                {purchased && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full text-xs font-bold text-green-600 uppercase tracking-widest">
                    <FiCheckCircle /> Đã sở hữu
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                {product.title}
              </h1>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex text-orange-400">
                    {[1,2,3,4,5].map(i => <FiStar key={i} className="fill-current" size={14} />)}
                  </div>
                  <span className="text-sm font-bold text-gray-400">5.0 (24 nhận xét)</span>
                </div>
                <span className="text-sm text-gray-400 font-medium">{product.salesCount || 0} lượt mua</span>
              </div>
            </div>

            {/* Price Card */}
            <div className="card-apple p-8 space-y-6 bg-white/50 backdrop-blur-sm">
              <div className="flex items-baseline gap-3">
                {couponValid ? (
                  <>
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">
                      {Math.round(discountedPrice).toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-xl text-gray-300 line-through">
                      {product.price.toLocaleString('vi-VN')}đ
                    </span>
                    <div className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-xs font-bold uppercase">
                      -{couponValid.discountPercent}%
                    </div>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900 tracking-tight">
                    {product.price.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>

              {purchased ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl text-sm font-medium border border-blue-100">
                    Bạn đã mua sản phẩm này. Bạn có thể tải xuống tệp tin bất cứ lúc nào.
                  </div>
                  <a 
                    href={product.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-3 w-full btn-apple-primary py-4 text-lg"
                  >
                    <FiDownload /> Tải xuống ngay
                  </a>
                </div>
              ) : canBuy ? (
                <div className="space-y-4">
                  {availableCoupons.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mã giảm giá</label>
                      <Select 
                        options={couponOptions} 
                        value={couponCode} 
                        onChange={handleCouponChange}
                        className="rounded-2xl"
                      />
                    </div>
                  )}
                  <Button 
                    onClick={handleBuy} 
                    loading={buying} 
                    className="w-full py-4 text-lg" 
                  >
                    Mua ngay
                  </Button>
                  <p className="text-center text-xs text-gray-400">Thanh toán an toàn qua MoMo. Nhận tệp tin ngay lập tức.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!isAuthenticated ? (
                    <Link to="/login" className="flex items-center justify-center w-full btn-apple-primary py-4 text-lg">
                      Đăng nhập để mua
                    </Link>
                  ) : (
                    <div className="p-4 bg-gray-100 text-gray-500 rounded-2xl text-center text-sm font-medium">
                      {isOwnProduct ? 'Bạn là người bán sản phẩm này' : 'Tài khoản không thể mua hàng'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seller Card */}
            {sellerId && (
              <div className="flex items-center gap-4 p-5 glass rounded-3xl">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {product.seller?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {product.seller?.sellerProfile?.shopName || product.seller?.name || 'Shop'}
                  </p>
                  <Link to={`/shop/${sellerId}`} className="text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors">
                    Xem cửa hàng
                  </Link>
                </div>
                <button 
                  onClick={() => {
                    if (window.openChatWith) {
                      window.openChatWith(sellerId, product.seller?.sellerProfile?.shopName || product.seller?.name || 'Shop');
                    }
                  }}
                  className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all shadow-sm border border-gray-100 active:scale-90"
                >
                  <FiMessageCircle size={22} />
                </button>
              </div>
            )}

            {/* Extra Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Cập nhật</p>
                <p className="text-sm font-bold text-gray-900">2 ngày trước</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Dung lượng</p>
                <p className="text-sm font-bold text-gray-900">12.5 MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-24 pt-24 border-t border-gray-100">
        <ReviewSection productId={id} purchased={purchased} />
      </div>
    </div>
  )
}

function FiStar({ className, size }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}