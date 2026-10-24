import { useState, useEffect } from 'react'
import api from '../lib/api'
import { FiTrendingUp, FiShoppingBag, FiDollarSign, FiPercent, FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function SellerAnalytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/orders/seller/stats')
        setStats(res.data)
      } catch (err) {
        toast.error('Không thể tải thống kê')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const cards = [
    { 
      title: 'Tổng doanh thu (Thực nhận)', 
      value: `${stats?.totalRevenue?.toLocaleString('vi-VN')}đ`, 
      icon: <FiDollarSign size={24} />, 
      color: 'bg-blue-50 text-blue-600',
      desc: 'Sau khi trừ phí sàn'
    },
    { 
      title: 'Tổng số đơn hàng', 
      value: stats?.totalSales || 0, 
      icon: <FiShoppingBag size={24} />, 
      color: 'bg-green-50 text-green-600',
      desc: 'Đã hoàn thành thanh toán'
    },
    { 
      title: 'Tổng phí nền tảng', 
      value: `${stats?.totalPlatformFee?.toLocaleString('vi-VN')}đ`, 
      icon: <FiPercent size={24} />, 
      color: 'bg-purple-50 text-purple-600',
      desc: 'Phí dịch vụ 5% hệ thống'
    },
    { 
      title: 'Doanh thu gộp', 
      value: `${stats?.totalGrossRevenue?.toLocaleString('vi-VN')}đ`, 
      icon: <FiTrendingUp size={24} />, 
      color: 'bg-orange-50 text-orange-600',
      desc: 'Tổng giá trị đơn hàng'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Thống kê bán hàng</h1>
          <p className="text-gray-500">Theo dõi hiệu quả kinh doanh của shop bạn tại MarketHub</p>
        </div>
        <div className="flex gap-3">
          <Link to="/create-product" className="btn-apple-primary px-6">
            Đăng sản phẩm mới
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="card-apple p-8 space-y-4 hover:shadow-apple-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
              <p className="text-xs text-gray-400 mt-2">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Giao dịch gần đây</h2>
          <Link to="/seller-orders" className="text-blue-600 font-semibold flex items-center gap-1 hover:underline">
            Xem tất cả <FiArrowRight size={16} />
          </Link>
        </div>
        
        <div className="card-apple overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sản phẩm</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Khách hàng</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Giá</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Ngày mua</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.orders?.slice(0, 5).map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">Sản phẩm #{order.product.slice(-6)}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">ID: {order.paymentId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">Khách hàng #{order.buyer.slice(-6)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{order.amount?.toLocaleString('vi-VN')}đ</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                  </tr>
                ))}
                {(!stats?.orders || stats.orders.length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400 italic">
                      Chưa có giao dịch nào phát sinh
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
