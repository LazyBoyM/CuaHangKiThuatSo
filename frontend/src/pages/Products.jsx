import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import ProductCard from '../components/ProductCard'
import Input from '../components/Input'
import Select from '../components/Select'
import LoadingSpinner from '../components/LoadingSpinner'
import Card from '../components/Card'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    api.get('/products?limit=100').then(res => {
      setProducts(res.data.products || [])
      setLoading(false)
    })
  }, [])

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
  const categoryOptions = [
    { value: '', label: 'Tất cả danh mục' },
    ...categories.map(c => ({ value: c, label: c }))
  ]

  const sortOptions = [
    { value: 'newest', label: 'Mới nhất' },
    { value: 'price_asc', label: 'Giá thấp đến cao' },
    { value: 'price_desc', label: 'Giá cao đến thấp' },
    { value: 'best_selling', label: 'Bán chạy nhất' }
  ]

  const filteredProducts = products
    .filter(p => {
      const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
      const matchCategory = !category || p.category === category
      return matchSearch && matchCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price
        case 'price_desc':
          return b.price - a.price
        case 'best_selling':
          return (b.salesCount || 0) - (a.salesCount || 0)
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <span>/</span>
        <span className="text-gray-700">Khám phá</span>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-semibold text-gray-900">Khám phá sản phẩm</h1>

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          />
        </div>
      </Card>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Hiển thị <span className="font-medium">{filteredProducts.length}</span> sản phẩm
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-gray-500 mb-4">Không tìm thấy sản phẩm nào</p>
          <button 
            onClick={() => { setSearch(''); setCategory(''); }}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Xóa bộ lọc
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.map(p => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}