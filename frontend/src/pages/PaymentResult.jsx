import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Button from '../components/Button'
import toast from 'react-hot-toast'

export default function PaymentResult() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [orderId, setOrderId] = useState(null)
  const called = useRef(false)

  const resultCode = searchParams.get('resultCode')
  const orderIdFromMoMo = searchParams.get('orderId')

  useEffect(() => {
    if (resultCode === '0' && orderIdFromMoMo && !called.current) {
      called.current = true
      
      api.post('/payments/test-momo-ipn', { orderId: orderIdFromMoMo, resultCode: 0 })
        .then(res => {
          setStatus('success')
          setOrderId(res.data.orderId)
          toast.success('🎉 Đặt hàng thành công!', { duration: 5000, position: 'top-center' })
        })
        .catch(() => setStatus('success'))
    } else if (resultCode && resultCode !== '0') {
      setStatus('failed')
    } else if (!orderIdFromMoMo && !called.current) {
      setStatus('failed')
    }
  }, [resultCode, orderIdFromMoMo])

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Đang xử lý thanh toán...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card padding="lg" className="text-center">
        {status === 'success' ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-600 mb-6">Đơn hàng của bạn đã được xác nhận.</p>
            <div className="space-y-3">
              {orderId && (
                <Link to={`/order/${orderId}`}>
                  <Button className="w-full">Xem đơn hàng & Tải xuống</Button>
                </Link>
              )}
              <Link to="/my-orders">
                <Button variant="secondary" className="w-full">Đơn mua của tôi</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="w-full">Về trang chủ</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Thanh toán thất bại</h2>
            <p className="text-gray-600 mb-6">Vui lòng thử lại.</p>
            <Link to="/">
              <Button variant="secondary">Về trang chủ</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  )
}