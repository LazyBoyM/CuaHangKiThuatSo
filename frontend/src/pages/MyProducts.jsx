import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function MyProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = () => {
    api.get('/products/my/list').then(res => {
      setProducts(res.data || [])
      setLoading(false)
    })
  }

  useEffect(fetchProducts, [])

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

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Sản phẩm của tôi</h1>
        <Link to="/create-product">
          <Button>+ Đăng sản phẩm mới</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">Bạn chưa có sản phẩm nào</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <Card key={product._id} padding="md">
              <div className="flex items-start gap-3">
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="" className="w-16 h-16 rounded object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    No img
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 line-clamp-2">{product.title}</h3>
                  <p className="text-primary-600 font-semibold mt-1">
                    {product.price?.toLocaleString('vi-VN')}đ
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={product.isApproved ? 'success' : 'warning'}>
                      {product.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </Badge>
                    <span className="text-xs text-gray-500">Đã bán: {product.salesCount || 0}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/product/${product._id}`} className="flex-1">
                  <Button variant="ghost" className="w-full" size="sm">Xem</Button>
                </Link>
                <Link to={`/edit-product/${product._id}`} className="flex-1">
                  <Button variant="ghost" className="w-full" size="sm">Sửa</Button>
                </Link>
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(product._id, product.title)}>
                  Xóa
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}