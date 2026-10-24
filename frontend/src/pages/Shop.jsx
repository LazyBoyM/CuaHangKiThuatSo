import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import Button from '../components/Button'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiMessageCircle, FiCalendar, FiBox, FiTrendingUp, FiStar } from 'react-icons/fi'

export default function Shop() {
  const { user } = useAuthStore()
  const { sellerId } = useParams()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalProducts: 0, totalSold: 0 })
  const [shopRating, setShopRating] = useState({ averageRating: 0, totalReviews: 0 })

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const shopRes = await api.get(`/users/shop/${sellerId}`)
        setShop(shopRes.data)

        const productsRes = await api.get(`/products?seller=${sellerId}&limit=100`)
        const productList = productsRes.data.products || []
        setProducts(productList)
        
        const totalSold = productList.reduce((sum, p) => sum + (p.salesCount || 0), 0)
        setStats({ totalProducts: productList.length, totalSold })

        // Fetch shop rating
        const ratingRes = await api.get(`/reviews/seller/${sellerId}/rating`)
        setShopRating(ratingRes.data)
      } catch (error) {
        console.error('Failed to fetch shop:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchShop()
  }, [sellerId])

  if (loading) return <LoadingSpinner />
  if (!shop) return (
    <div className="text-center py-24 container-custom">
      <p className="text-gray-400 mb-6 text-xl">Không tìm thấy shop này</p>
      <Link to="/" className="btn-apple-primary">Quay lại trang chủ</Link>
    </div>
  )

  return (
    <div className="container-custom pb-24 space-y-12">
      {/* Shop Header Section */}
      <section className="card-apple p-8 md:p-12 bg-white overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
          {/* Shop Avatar */}
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[32px] flex items-center justify-center text-white text-5xl font-bold shadow-xl flex-shrink-0">
            {shop.name?.charAt(0)?.toUpperCase()}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
                {shop.sellerProfile?.shopName || shop.name}
              </h1>
              <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2">
                {shop.email}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide uppercase">
                <FiBox size={14} /> {stats.totalProducts} sản phẩm
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-bold tracking-wide uppercase">
                <FiTrendingUp size={14} /> {stats.totalSold} lượt bán
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-sm font-bold tracking-wide uppercase">
                <FiStar size={14} className="fill-current" /> {shopRating.averageRating?.toFixed(1) || '0.0'} ({shopRating.totalReviews || 0})
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-500 rounded-full text-sm font-bold tracking-wide uppercase">
                <FiCalendar size={14} /> Gia nhập {new Date(shop.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
          
          {user?._id !== shop._id && user?.id !== shop._id && user?.role !== 'seller' && user?.role !== 'admin' && (
            <div className="flex-shrink-0">
              <Button 
                onClick={() => window.openChatWith && window.openChatWith(shop._id, shop.sellerProfile?.shopName || shop.name)}
                className="py-4 px-8 text-lg"
              >
                <FiMessageCircle className="mr-2" size={20} /> Chat với Shop
              </Button>
            </div>
          )}
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
      </section>

      {/* Products Grid */}
      <section>
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Sản phẩm của shop</h2>
          <span className="text-gray-400 font-medium">{products.length} kết quả</span>
        </div>
        
        {products.length === 0 ? (
          <div className="card-apple p-20 text-center bg-gray-50/50 border-dashed border-2">
            <p className="text-gray-400 text-lg">Shop hiện chưa đăng sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-10">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}