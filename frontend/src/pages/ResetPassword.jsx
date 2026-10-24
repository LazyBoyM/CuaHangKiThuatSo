import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await api.post('/users/reset-password', { token, password })
      alert('Đặt lại mật khẩu thành công!')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto text-center">
        <Card padding="lg">
          <p className="text-danger mb-4">Token không hợp lệ</p>
          <Link to="/forgot-password" className="text-primary-600">Yêu cầu lại</Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Đặt lại mật khẩu</h2>
        
        {error && <div className="bg-red-50 text-danger text-sm p-3 rounded-md mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Đặt lại mật khẩu
          </Button>
        </form>
      </Card>
    </div>
  )
}