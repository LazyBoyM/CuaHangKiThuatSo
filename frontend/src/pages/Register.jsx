import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import Input from '../components/Input'
import Button from '../components/Button'
import Card from '../components/Card'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('buyer')
  const [loading, setLoading] = useState(false)
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await registerUser({ name, email, password, role })
      navigate('/login')
    } catch (err) {
      alert(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Đăng ký</h2>
        <p className="text-gray-500 text-center mb-6">Tạo tài khoản để bắt đầu</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Họ tên"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {/* Role Selection */}
          <div className="flex gap-4 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="buyer"
                checked={role === 'buyer'}
                onChange={(e) => setRole(e.target.value)}
                className="text-primary-600 focus:ring-primary-200"
              />
              <span className="text-sm text-gray-700">Người mua</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="seller"
                checked={role === 'seller'}
                onChange={(e) => setRole(e.target.value)}
                className="text-primary-600 focus:ring-primary-200"
              />
              <span className="text-sm text-gray-700">Người bán</span>
            </label>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Đăng ký
          </Button>
        </form>
        
        <p className="text-center mt-4 text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary-600 font-medium">Đăng nhập</Link>
        </p>
      </Card>
    </div>
  )
}