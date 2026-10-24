import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await api.post('/users/forgot-password', { email })
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Quên mật khẩu</h2>
        <p className="text-gray-500 text-center mb-6">
          Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>
        
        {message && <div className="bg-green-50 text-green-800 text-sm p-3 rounded-md mb-4">{message}</div>}
        {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-md mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Gửi yêu cầu
          </Button>
        </form>
        
        <p className="text-center mt-4">
          <Link to="/login" className="text-sm text-primary-600">← Quay lại đăng nhập</Link>
        </p>
      </Card>
    </div>
  )
}