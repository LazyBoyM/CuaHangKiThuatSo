import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import ProductCard from '../components/ProductCard'
import { FiArrowRight, FiDownload, FiCheckCircle, FiShield } from 'react-icons/fi'
import { useAuthStore } from '../lib/store'

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products?limit=8')
        setProducts(response.data.products || [])
      } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])


  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="container-custom relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-bold tracking-wide uppercase animate-fade-in">
              Chào mừng bạn đến với MarketHub
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Trải nghiệm mua sắm <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">tinh tế</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Khám phá bộ sưu tập các sản phẩm công nghệ và phong cách sống cao cấp, được tuyển chọn kỹ lưỡng dành riêng cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/products" className="btn-apple-primary text-lg px-8 py-4 w-full sm:w-auto">
                Mua sắm ngay
              </Link>
              {!isAuthenticated ? (
                <Link to="/register" className="btn-apple-secondary text-lg px-8 py-4 w-full sm:w-auto">
                  Trở thành người bán
                </Link>
              ) : user?.role === 'seller' ? (
                <Link to="/my-products" className="btn-apple-secondary text-lg px-8 py-4 w-full sm:w-auto">
                  Quản lý sản phẩm
                </Link>
              ) : (
                <Link to="/wishlist" className="btn-apple-secondary text-lg px-8 py-4 w-full sm:w-auto">
                  Danh sách yêu thích
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none -z-10">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-60 animate-blob"></div>
          <div className="absolute bottom-0 right-[-100px] w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px] opacity-60 animate-blob" style={{ animationDelay: '2s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <FiDownload size={24} />, title: 'Tải xuống tức thì', desc: 'Nhận link tải xuống ngay sau khi thanh toán thành công.' },
            { icon: <FiCheckCircle size={24} />, title: 'Bản quyền đảm bảo', desc: 'Mọi sản phẩm đều được kiểm duyệt kỹ lưỡng về nguồn gốc.' },
            { icon: <FiShield size={24} />, title: 'Thanh toán an toàn', desc: 'Giao dịch được bảo mật bởi các cổng thanh toán hàng đầu.' }
          ].map((f, i) => (
            <div key={i} className="card-apple p-8 flex flex-col items-center text-center space-y-4 border-none bg-white/50 backdrop-blur-sm">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* New Products Section */}
      <section className="container-custom">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Sản phẩm mới nhất</h2>
            <p className="text-gray-500">Cập nhật xu hướng mới nhất tại MarketHub</p>
          </div>
          <Link to="/products" className="group flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Xem tất cả <FiArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse rounded-[var(--apple-radius)]"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container-custom">
        <div className="relative overflow-hidden rounded-[32px] bg-black px-8 py-20 md:px-20 md:py-24 text-center">
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
              Sẵn sàng để nâng tầm <br className="hidden md:block" /> trải nghiệm mua sắm?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Gia nhập cộng đồng MarketHub ngay hôm nay để nhận được những ưu đãi độc quyền và cập nhật mới nhất.
            </p>
            <Link to={isAuthenticated ? "/products" : "/register"} className="btn-apple bg-white text-black hover:bg-gray-100 text-lg px-10 py-4">
              {isAuthenticated ? "Khám phá ngay" : "Đăng ký tài khoản"}
            </Link>
          </div>
          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600 rounded-full blur-[120px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        </div>
      </section>
    </div>
  )
}