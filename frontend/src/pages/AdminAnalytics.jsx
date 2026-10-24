import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { FiArrowLeft, FiActivity, FiShoppingBag, FiDollarSign, FiUsers, FiTrendingUp, FiAward } from 'react-icons/fi'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function AdminAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/admin/analytics').then(res => {
      setData(res.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <div className="text-center py-24 text-gray-400">Không có dữ liệu thống kê</div>

  // Chart configs
  const revenueChartData = {
    labels: data.revenueByDay.map(d => {
      const date = new Date(d._id)
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }),
    datasets: [{
      label: 'Doanh thu',
      data: data.revenueByDay.map(d => d.revenue),
      borderColor: '#2563eb',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#2563eb',
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1f2937',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => `Doanh thu: ${context.parsed.y.toLocaleString('vi-VN')}đ`
        }
      }
    },
    scales: {
      y: {
        grid: { borderDash: [5, 5], color: '#e5e7eb' },
        ticks: { 
          callback: (value) => value >= 1000000 ? (value/1000000) + 'M' : value.toLocaleString('vi-VN') + 'đ',
          font: { size: 11 }
        }
      },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 mb-2 transition-colors">
            <FiArrowLeft /> Quay lại Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Phân tích hệ thống</h1>
          <p className="text-gray-500 text-sm mt-1">Dữ liệu được cập nhật thời gian thực dựa trên các giao dịch gần nhất</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-600">
              7 ngày qua
           </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Thực thu sàn (Fees)', value: data.totalPlatformEarnings, icon: <FiDollarSign />, color: 'blue' },
          { label: 'Tổng giá trị GD', value: data.revenueByDay.reduce((sum, d) => sum + d.revenue, 0), icon: <FiActivity />, color: 'emerald' },
          { label: 'Tổng đơn hàng', value: data.revenueByDay.reduce((sum, d) => sum + d.count, 0), icon: <FiShoppingBag />, color: 'purple' },
          { label: 'Sản phẩm hot', value: data.topProducts[0]?.title || 'N/A', icon: <FiTrendingUp />, color: 'amber', isString: true },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-apple-sm border border-gray-100 hover:shadow-apple-md transition-all group">
             <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                {stat.icon}
             </div>
             <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
             <h3 className={`text-2xl font-bold mt-1 truncate ${stat.color === 'blue' ? 'text-blue-600' : 'text-gray-900'}`}>
                {stat.isString ? stat.value : stat.value.toLocaleString('vi-VN') + 'đ'}
             </h3>
          </div>
        ))}
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-apple-sm border border-gray-100">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">Xu hướng doanh thu</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">
                 <FiTrendingUp /> +12.5%
              </div>
           </div>
           <div className="h-[350px]">
              <Line data={revenueChartData} options={chartOptions} />
           </div>
        </div>

        {/* Top Sellers Sidebar */}
        <div className="bg-white p-8 rounded-3xl shadow-apple-sm border border-gray-100 flex flex-col">
           <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
             <FiAward className="text-amber-500" /> Ngôi sao doanh thu
           </h2>
           <div className="space-y-6 flex-1">
              {data.topSellers.map((s, i) => (
                <div key={s._id} className="flex items-center gap-4 group">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                      i === 0 ? 'bg-amber-100 text-amber-600' : 
                      i === 1 ? 'bg-gray-100 text-gray-500' : 
                      i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'
                   }`}>
                      {i + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{s.name}</p>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-tight">{s.totalOrders} đơn hàng</p>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{s.revenue.toLocaleString('vi-VN')}đ</p>
                   </div>
                </div>
              ))}
           </div>
           <Link to="/admin/users" className="mt-8 text-center text-sm font-bold text-blue-600 hover:underline">
              Xem tất cả người dùng
           </Link>
        </div>
      </div>

      {/* Bottom Grid: Top Products */}
      <div className="bg-white p-8 rounded-3xl shadow-apple-sm border border-gray-100">
         <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
           <FiShoppingBag className="text-blue-500" /> Top sản phẩm bán chạy nhất
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {data.topProducts.map((p, i) => (
              <div key={i} className="group cursor-pointer">
                 <div className="relative aspect-[4/5] rounded-2xl bg-gray-50 overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
                    {p.thumbnail ? (
                      <img 
                        src={p.thumbnail} 
                        alt={p.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-300">
                        <FiShoppingBag size={24} className="mb-1 opacity-20" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-30">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur shadow-sm px-2 py-1 rounded-lg text-[10px] font-black text-blue-600">
                       TOP {i+1}
                    </div>
                 </div>
                 <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">{p.title || 'Sản phẩm không tên'}</h4>
                 <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{p.totalSold} đã bán</span>
                    <span className="text-xs text-gray-400 font-medium">{p.price?.toLocaleString('vi-VN')}đ</span>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}