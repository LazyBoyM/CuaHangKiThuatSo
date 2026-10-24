import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('all')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data || [])
    } catch {
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleBan = async (id, currentStatus, name) => {
    if (!window.confirm(`${currentStatus ? 'Mở khóa' : 'Khóa'} tài khoản "${name}"?`)) return
    try {
      await api.put(`/users/${id}/ban`)
      toast.success(currentStatus ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản')
      fetchUsers()
    } catch {
      toast.error('Thao tác thất bại')
    }
  }

  const filteredUsers = users.filter(u => {
    if (filterRole === 'all') return true
    return u.role === filterRole
  })

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    seller: users.filter(u => u.role === 'seller').length,
    buyer: users.filter(u => u.role === 'buyer').length,
    banned: users.filter(u => u.isBanned).length
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý người dùng</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchUsers}>Làm mới</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Tổng</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-semibold text-red-600">{stats.admin}</p>
          <p className="text-sm text-gray-500">Quản trị viên</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-semibold text-green-600">{stats.seller}</p>
          <p className="text-sm text-gray-500">Người bán</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-semibold text-blue-600">{stats.buyer}</p>
          <p className="text-sm text-gray-500">Người mua</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-semibold text-orange-600">{stats.banned}</p>
          <p className="text-sm text-gray-500">Bị khóa</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Lọc:</span>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
        >
          <option value="all">Tất cả</option>
          <option value="admin">Quản trị viên</option>
          <option value="seller">Người bán</option>
          <option value="buyer">Người mua</option>
        </select>
      </div>

      {/* Table */}
      <Card padding="none">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  Không có người dùng nào
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={
                      u.role === 'admin' ? 'danger' : 
                      u.role === 'seller' ? 'success' : 'info'
                    }>
                      {u.role === 'admin' ? 'Quản trị viên' : 
                       u.role === 'seller' ? 'Người bán' : 'Người mua'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={u.isBanned ? 'danger' : 'success'}>
                      {u.isBanned ? 'Đã khóa' : 'Hoạt động'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {u.role !== 'admin' && (
                      <Button
                        variant={u.isBanned ? 'success' : 'danger'}
                        size="sm"
                        onClick={() => handleToggleBan(u._id, u.isBanned, u.name)}
                      >
                        {u.isBanned ? 'Mở khóa' : 'Khóa'}
                      </Button>
                    )}
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