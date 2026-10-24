import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const fetchCoupons = () => {
    api.get('/coupons/admin/all').then(res => {
      setCoupons(res.data || [])
      setLoading(false)
    })
  }

  useEffect(fetchCoupons, [])

  const onCreate = async (data) => {
    setCreating(true)
    try {
      await api.post('/coupons', {
        code: data.code,
        discountPercent: Number(data.discountPercent),
        maxUses: Number(data.maxUses),
        expiresAt: data.expiresAt,
        type: 'platform'
      })
      toast.success('Tạo mã giảm giá thành công')
      reset()
      fetchCoupons()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo mã')
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      await api.patch(`/coupons/${id}/toggle`)
      toast.success('Cập nhật trạng thái thành công')
      fetchCoupons()
    } catch {
      toast.error('Không thể cập nhật')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Mã giảm giá toàn sàn</h1>
      </div>

      <Card>
        <h2 className="font-medium text-gray-900 mb-4">Tạo mã mới</h2>
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input 
              placeholder="Mã (VD: SALE50)" 
              {...register('code', { required: true })} 
            />
            <Input 
              type="number" 
              placeholder="Giảm %" 
              {...register('discountPercent', { required: true, min: 1, max: 99 })} 
            />
            <Input 
              type="number" 
              placeholder="Số lần dùng" 
              {...register('maxUses', { required: true, min: 1 })} 
            />
            <Input 
              type="date" 
              {...register('expiresAt', { required: true })} 
            />
          </div>
          <Button type="submit" loading={creating}>Tạo mã</Button>
        </form>
      </Card>

      <Card padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Mã</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Giảm</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Đã dùng</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Hết hạn</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Chưa có mã giảm giá nào
                </td>
              </tr>
            ) : (
              coupons.map(c => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-mono text-sm">{c.code}</td>
                  <td className="px-4 py-3 text-sm">{c.discountPercent}%</td>
                  <td className="px-4 py-3 text-sm">{c.usedCount}/{c.maxUses}</td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(c.expiresAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.isActive ? 'success' : 'gray'}>
                      {c.isActive ? 'Hoạt động' : 'Vô hiệu'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(c._id)}>
                      {c.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}