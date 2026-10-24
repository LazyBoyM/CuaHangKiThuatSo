import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import { useState, useEffect } from 'react'
import { FiSearch, FiUser, FiShoppingBag, FiMenu, FiX, FiLogOut, FiHeart, FiTag, FiTrendingUp } from 'react-icons/fi'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowMenu(false)
  }

  const isAdmin = user?.role === 'admin'
  const isSeller = user?.role === 'seller'

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-500 ${
      isScrolled ? 'py-2 glass shadow-apple-sm' : 'py-4 bg-transparent'
    }`}>
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
              MarketHub
            </span>
          </Link>
          
          {/* Desktop Nav - Removed as requested */}
          
          <div className="flex items-center gap-4 ml-auto">
            {/* Search Trigger */}
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <FiSearch size={20} />
            </button>


            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-gray-200 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                      {user?.name?.[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-3 w-64 glass shadow-apple-lg rounded-2xl py-2 animate-fade-in overflow-hidden border border-white/40">
                      <div className="px-5 py-4 border-b border-gray-100/50">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tài khoản</p>
                        <p className="font-bold text-gray-900 truncate">{user?.email}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          isAdmin ? 'bg-red-50 text-red-600' :
                          isSeller ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {isAdmin ? 'Quản trị viên' : isSeller ? 'Người bán' : 'Khách hàng'}
                        </span>
                      </div>

                      <div className="p-2 space-y-1">
                        {!isAdmin && (
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                            <FiUser className="text-gray-400" /> Hồ sơ
                          </Link>
                        )}

                        {isAdmin ? (

                          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                            <FiMenu className="text-gray-400" /> Quản lý hệ thống
                          </Link>
                        ) : isSeller ? (
                          <>
                            <Link to="/seller-analytics" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                              <FiTrendingUp className="text-gray-400" /> Thống kê
                            </Link>
                            <Link to="/my-products" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                              <FiShoppingBag className="text-gray-400" /> Sản phẩm của tôi
                            </Link>
                            <Link to="/seller-orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                              <FiShoppingBag className="text-gray-400" /> Đơn bán
                            </Link>
                            <Link to="/seller-coupons" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                              <FiTag className="text-gray-400" /> Mã giảm giá
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                              <FiHeart className="text-gray-400" /> Yêu thích
                            </Link>
                            <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-white/50 rounded-xl transition-colors" onClick={() => setShowMenu(false)}>
                              <FiShoppingBag className="text-gray-400" /> Đơn mua
                            </Link>
                          </>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-2"
                        >
                          <FiLogOut /> Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors px-4 py-2">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-apple-primary text-sm px-6">
                  Bắt đầu ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}