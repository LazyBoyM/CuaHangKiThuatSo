import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import ReviewSection from '../components/ReviewSection'

export default function OrderDetail() {
  const { user } = useAuthStore()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(res => {
      setOrder(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [orderId])

  if (loading) return <LoadingSpinner />
  if (!order) return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">Không tìm thấy đơn hàng</p>
      <Link to="/my-orders">
        <Button variant="secondary">← Quay lại thư viện</Button>
      </Link>
    </div>
  )

  const product = order.product || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link to="/my-orders" className="hover:text-primary-600">Thư viện của tôi</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Chi tiết file</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Sản phẩm và Download (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="none" className="overflow-hidden border-0 ring-1 ring-gray-100">
            <div className="aspect-[2/1] sm:aspect-[21/9] bg-gray-900 relative">
              {product.thumbnail ? (
                <img src={product.thumbnail} className="w-full h-full object-cover opacity-80" alt={product.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <Badge variant="success" className="w-fit mb-3 bg-green-500/20 text-green-300 border-0">Hoàn thành</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{product.title || 'Sản phẩm đã bị xóa'}</h1>
                <p className="text-gray-300 text-sm flex items-center gap-4">
                  <span>Mã đơn: #{order._id?.slice(-8).toUpperCase()}</span>
                  <span>Ngày mua: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-white border-b border-gray-100 flex flex-col sm:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Tệp tin sản phẩm</h3>
                <p className="text-sm text-gray-500">Giữ file này an toàn và không chia sẻ cho người khác.</p>
              </div>
              
              {product.fileUrl ? (
                <a href={product.fileUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Tải File Về Máy
                  </Button>
                </a>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
                  <span>⚠️ Chưa có link tải. Liên hệ người bán.</span>
                </div>
              )}
            </div>
          </Card>

          {/* Khu vực Đánh giá */}
          {product._id && (
             <div className="bg-white rounded-apple border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Đánh giá sản phẩm</h3>
                <ReviewSection productId={product._id} purchased={true} />
             </div>
          )}
        </div>

        {/* Cột phải: Hóa đơn và Người bán (1/3) */}
        <div className="space-y-6">
          <Card className="bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Biên lai thanh toán
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Mã giao dịch</span>
                <span className="font-medium text-gray-900">#{order.paymentId || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Ngày thanh toán</span>
                <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Trạng thái</span>
                <span className="font-medium text-emerald-600">Thành công</span>
              </div>
              <div className="pt-3 mt-3 border-t border-gray-200 border-dashed flex justify-between items-end">
                <span className="text-gray-900 font-medium">Tổng tiền đã trả</span>
                <span className="text-xl font-bold text-gray-900">{order.amount?.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Thông tin người bán
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg shrink-0">
                {(product.seller?.sellerProfile?.shopName || product.seller?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {product.seller?.sellerProfile?.shopName || product.seller?.name || 'Shop / Đối tác'}
                </p>
                <p className="text-xs text-gray-500">Cung cấp sản phẩm này</p>
              </div>
            </div>
            {!isAdmin && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  const sellerObj = product.seller;
                  const sellerId = sellerObj?._id || order.seller;
                  const sellerName = sellerObj?.sellerProfile?.shopName || sellerObj?.name || 'Shop';
                  
                  if (window.openChatWith && sellerId) {
                    window.openChatWith(sellerId, sellerName);
                  }
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Chat hỗ trợ
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}