import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import Input from '../components/Input'
import Button from '../components/Button'
import Card from '../components/Card'

// Dữ liệu mẫu cho 3 role
const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@market.com',
    password: '123456',
    color: 'red'
  },
  {
    role: 'Seller',
    email: 'shop1@demo.com',
    password: '123456',
    color: 'green'
  },
  {
    role: 'Buyer',
    email: 'buyer1@demo.com',
    password: '123456',
    color: 'blue'
  }
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  // Hàm tự động điền tài khoản mẫu
  const fillDemoAccount = (account) => {
    setEmail(account.email)
    setPassword(account.password)
  }

  return (
    <div className="max-w-lg mx-auto pt-10 space-y-6">
      {/* Demo Accounts */}
      <div>
        <p className="text-sm text-gray-500 text-center mb-3">Dùng thử tài khoản mẫu</p>
        <div className="grid grid-cols-3 gap-3">
          {DEMO_ACCOUNTS.map(account => (
            <button
              key={account.role}
              onClick={() => fillDemoAccount(account)}
              className={`p-3 rounded-apple-sm border border-gray-200 bg-white hover:shadow-apple-md transition-all duration-200 text-center ${
                email === account.email ? 'ring-2 ring-primary-200' : ''
              }`}
            >
              <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                account.color === 'red' ? 'bg-red-400' :
                account.color === 'green' ? 'bg-green-400' : 'bg-blue-400'
              }`} />
              <p className="text-sm font-medium text-gray-900">{account.role}</p>
              <p className="text-xs text-gray-400">{account.email}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Login Form */}
      <Card padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Đăng nhập</h2>
        <p className="text-gray-500 text-center mb-8">Chào mừng trở lại</p>
        
        {error && (
          <div className="bg-red-50 text-danger text-sm p-3 rounded-apple-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <Button type="submit" loading={loading} className="w-full">
            Đăng nhập
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-3">
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
            Quên mật khẩu?
          </Link>
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary-600 font-medium">Đăng ký</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}