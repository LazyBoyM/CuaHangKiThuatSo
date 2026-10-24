import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import Button from '../components/Button'
import { useAuthStore } from '../lib/store'

export default function MyOrders() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewedOrders, setReviewedOrders] = useState({})

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    api.get('/orders/my').then(res => {
      const orderData = res.data || []
      setOrders(orderData)
      setLoading(false)
      
      // Kiểm tra đã đánh giá chưa
      orderData.forEach(order => {
        if (order.product?._id) {
          api.get(`/reviews/check/${order.product._id}`)
            .then(res => setReviewedOrders(prev => ({ ...prev, [order._id]: res.data.reviewed })))
            .catch(() => {})
        }
      })
    })
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Thư viện của tôi</h1>
        <p className="text-sm text-gray-500">{orders.length} sản phẩm</p>
      </div>

      {orders.length === 0 ? (
        <Card padding="xl" className="text-center border-dashed">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Thư viện trống</h3>
          <p className="text-gray-500 mb-6">Bạn chưa có sản phẩm số nào trong thư viện.</p>
          <Link to="/products">
            <Button>Khám phá sản phẩm</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => (
            <Card key={order._id} padding="none" className="flex flex-col overflow-hidden group hover:border-primary-200">
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {order.product?.thumbnail ? (
                  <img src={order.product.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    Sản phẩm bị xóa
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                  <Badge variant={order.status === 'completed' ? 'success' : 'warning'} className="shadow-sm backdrop-blur-md bg-white/90">
                    {order.status === 'completed' ? 'Thành công' : 'Đang xử lý'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <Link to={`/product/${order.product?._id}`} className="font-semibold text-gray-900 line-clamp-2 hover:text-primary-600 mb-1">
                  {order.product?.title || 'Sản phẩm không còn tồn tại'}
                </Link>
                <div className="flex items-center justify-between mt-1 mb-4 text-xs text-gray-500">
                  <span>Mã: #{order._id.slice(-6).toUpperCase()}</span>
                  <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex gap-2">
                    <Link to={`/order/${order._id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Tải file
                      </Button>
                    </Link>
                    {!isAdmin && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          const sellerObj = order.product?.seller;
                          const sellerId = sellerObj?._id || order.seller;
                          const sellerName = sellerObj?.sellerProfile?.shopName || sellerObj?.name || 'Shop';
                          
                          if (window.openChatWith && sellerId) {
                            window.openChatWith(sellerId, sellerName);
                          }
                        }}
                        className="px-3"
                        title="Chat với người bán"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  
                  {order.status === 'completed' && order.product && !reviewedOrders[order._id] && (
                    <Link to={`/product/${order.product._id}?review=true`} className="block w-full">
                      <Button variant="ghost" size="sm" className="w-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50">
                        <span className="text-yellow-400 mr-1">★</span> Đánh giá sản phẩm
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}