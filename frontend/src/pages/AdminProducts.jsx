import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/products/admin/all?limit=100')
      setProducts(res.data.products || [])
    } catch {
      toast.error('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleApprove = async (id) => {
    try {
      await api.put(`/products/${id}/approve`)
      toast.success('Đã duyệt sản phẩm')
      fetchProducts()
    } catch {
      toast.error('Không thể duyệt sản phẩm')
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Xóa sản phẩm "${title}"?`)) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Đã xóa sản phẩm')
      fetchProducts()
    } catch {
      toast.error('Không thể xóa sản phẩm')
    }
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'pending') return !p.isApproved
    if (filter === 'approved') return p.isApproved
    return true
  })

  const pendingCount = products.filter(p => !p.isApproved).length
  const approvedCount = products.filter(p => p.isApproved).length

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
          <h1 className="text-2xl font-semibold text-gray-900">Duyệt sản phẩm</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchProducts}>Làm mới</Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'pending' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Chờ duyệt ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'approved' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đã duyệt ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all' 
              ? 'border-primary-600 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tất cả ({products.length})
        </button>
      </div>

      {/* List */}
      {filteredProducts.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            {filter === 'pending' ? 'Không có sản phẩm chờ duyệt' : 'Không có sản phẩm nào'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <Card key={product._id} padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                      No img
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500">
                      {product.price?.toLocaleString('vi-VN')}đ · {product.category || 'Không danh mục'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Người bán: {product.seller?.sellerProfile?.shopName || product.seller?.name || product.seller || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!product.isApproved && (
                    <Button size="sm" variant="success" onClick={() => handleApprove(product._id)}>
                      Duyệt
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => handleDelete(product._id, product.title)}>
                    Xóa
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}