import { useForm } from 'react-hook-form'
import { useAuthStore } from '../lib/store'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import toast from 'react-hot-toast'
import Button from '../components/Button'
import { FiUser, FiMail, FiShield, FiLock, FiCamera, FiEye, FiEyeOff } from 'react-icons/fi'

export default function Profile() {
  const { user, setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch } = useForm()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)


  // Redirect admin users
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      // For sellers, user.name is synced with shopName on the backend
      setValue('name', user.name)
      setValue('avatar', user.avatar || '')
    }
  }, [user, setValue])


  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // If seller, we merge name and shopName as requested
      const payload = {
        name: data.name,
        avatar: data.avatar,
        ...(user.role === 'seller' && { shopName: data.name }) // Merge shopName with name
      }
      
      if (data.password) {
        payload.password = data.password
      }

      const res = await api.put('/users/profile', payload)
      const { token, ...updatedUser } = res.data
      
      // Sync store (setAuth handles localStorage)
      setAuth(updatedUser, token)
      
      toast.success('Cập nhật thông tin thành công')

      
      // Clear password field
      setValue('password', '')

    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role === 'admin') return null

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4">
      <div className="flex flex-col items-center text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Cài đặt tài khoản</h1>
        <p className="text-gray-500">Quản lý thông tin cá nhân và mật khẩu của bạn</p>
      </div>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="card-apple p-8 md:p-12 bg-white">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-6 pb-10 border-b border-gray-100">
              <div className="relative group">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[40px] flex items-center justify-center text-4xl font-bold shadow-xl overflow-hidden">
                  {watch('avatar') ? (
                    <img src={watch('avatar')} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all border border-gray-100 cursor-pointer active:scale-90">
                  <FiCamera size={18} />
                  <input 
                    type="text" 
                    className="hidden" 
                    placeholder="Nhập URL ảnh đại diện" 
                    {...register('avatar')}
                    onChange={(e) => {
                      const url = prompt('Nhập URL ảnh đại diện mới của bạn:')
                      if (url) setValue('avatar', url)
                    }}
                  />
                </label>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    user?.role === 'seller' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {user?.role === 'seller' ? 'Người bán' : 'Người mua'}
                  </span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                  {user?.role === 'seller' ? 'Tên hiển thị / Tên Shop' : 'Họ và tên hiển thị'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiUser size={18} />
                  </div>
                  <input 
                    {...register('name', { required: 'Vui lòng nhập tên' })}
                    placeholder="Nhập tên hiển thị của bạn"
                    className="w-full pl-12 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900 font-medium"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="pt-6 border-t border-gray-100 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <FiLock className="text-gray-400" />
                  <h3 className="font-bold text-gray-900">Thay đổi mật khẩu</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mật khẩu mới</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      {...register('password')}
                      placeholder="Để trống nếu không đổi mật khẩu"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none text-gray-900"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                loading={loading} 
                className="w-full md:w-auto py-4 px-12 text-lg"
              >
                Cập nhật thông tin
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}