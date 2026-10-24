import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import ProductCard from '../components/ProductCard'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Wishlist() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products/wishlist')
      .then(res => {
        setProducts(res.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-gray-900">Sản phẩm yêu thích</h1>
      
      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">Bạn chưa yêu thích sản phẩm nào</p>
          <Link to="/products" className="text-primary-600 hover:text-primary-700">
            Khám phá sản phẩm →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}