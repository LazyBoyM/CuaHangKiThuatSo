import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '../lib/api'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function SellerCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const { register, handleSubmit, reset } = useForm()

  const fetchCoupons = () => {
    api.get('/coupons/seller').then(res => {
      setCoupons(res.data || [])
      setLoading(false)
    })
  }

  useEffect(fetchCoupons, [])

  const filteredCoupons = coupons.filter(c => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return c.isActive
    return !c.isActive
  })

  const onCreate = async (data) => {
    setCreating(true)
    try {
      await api.post('/coupons', {
        ...data,
        discountPercent: Number(data.discountPercent),
        maxUses: Number(data.maxUses),
        type: 'seller'
      })
      toast.success('Tạo mã giảm giá thành công!')
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
      <h1 className="text-2xl font-semibold text-gray-900">Quản lý mã giảm giá</h1>

      {/* Create Form */}
      <Card>
        <h2 className="font-medium text-gray-900 mb-4">Tạo mã mới</h2>
        <form onSubmit={handleSubmit(onCreate)} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Mã (VD: SALE50)" {...register('code', { required: true })} />
          <Input type="number" placeholder="Giảm %" {...register('discountPercent', { required: true, min: 1, max: 99 })} />
          <Input type="number" placeholder="Số lần dùng" {...register('maxUses', { required: true, min: 1 })} />
          <Input type="date" {...register('expiresAt', { required: true })} />
          <Button type="submit" loading={creating}>Tạo</Button>
        </form>
      </Card>

      {/* List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Danh sách mã</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Đã vô hiệu</option>
          </select>
        </div>

        {filteredCoupons.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-4">Chưa có mã giảm giá nào</p>
          </Card>
        ) : (
          filteredCoupons.map(c => (
            <Card key={c._id} padding="md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{c.code}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Giảm {c.discountPercent}% · Đã dùng {c.usedCount}/{c.maxUses} · Hết hạn {new Date(c.expiresAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={c.isActive ? 'success' : 'gray'}>
                    {c.isActive ? 'Hoạt động' : 'Vô hiệu'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleToggle(c._id)}>
                    {c.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}