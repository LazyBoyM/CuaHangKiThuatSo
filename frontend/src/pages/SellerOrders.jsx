import { useEffect, useState } from 'react'
import api from '../lib/api'
import Card from '../components/Card'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'

export default function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders/seller').then(res => {
      setOrders(res.data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <LoadingSpinner />

  const totalGross = orders.reduce((sum, o) => sum + o.amount, 0)
  const totalNet = orders.reduce((sum, o) => sum + (o.sellerAmount || o.amount), 0)
  const totalFee = totalGross - totalNet

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Đơn bán của tôi</h1>
        <div className="flex gap-3">
          <Card padding="sm" className="bg-gray-50">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Thực nhận</span>
            <p className="text-xl font-bold text-primary-600">{totalNet.toLocaleString('vi-VN')}đ</p>
          </Card>
          <Card padding="sm">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Phí sàn</span>
            <p className="text-lg font-semibold text-gray-400">{totalFee.toLocaleString('vi-VN')}đ</p>
          </Card>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">Chưa có đơn hàng nào</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order._id} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Đơn hàng #{order._id.slice(-6)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    +{order.sellerAmount?.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-xs text-gray-400 line-through">
                    {order.amount?.toLocaleString('vi-VN')}đ
                  </p>
                  <Badge variant={order.status === 'completed' ? 'success' : 'warning'} className="mt-1">
                    {order.status === 'completed' ? 'Hoàn thành' : order.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}