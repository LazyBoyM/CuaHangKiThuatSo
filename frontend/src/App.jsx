import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Dashboard from './pages/Dashboard'
import CreateProduct from './pages/CreateProduct'
import MyOrders from './pages/MyOrders'
import MyProducts from './pages/MyProducts'
import SellerOrders from './pages/SellerOrders'
import PaymentResult from './pages/PaymentResult'
import Profile from './pages/Profile'
import SellerCoupons from './pages/SellerCoupons'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminProducts from './pages/AdminProducts'
import AdminCoupons from './pages/AdminCoupons'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { useAuthStore } from './lib/store'
import { useEffect } from 'react'
import AdminAnalytics from './pages/AdminAnalytics'
import Shop from './pages/Shop'
import Wishlist from './pages/Wishlist'
import OrderDetail from './pages/OrderDetail'
import EditProduct from './pages/EditProduct'
import SellerAnalytics from './pages/SellerAnalytics'

function App() {

  const { loadUser } = useAuthStore()
  
  useEffect(() => {
    loadUser()
  }, [])

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="products" element={<Products />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="create-product" element={<CreateProduct />} />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="my-products" element={<MyProducts />} />
          <Route path="edit-product/:id" element={<EditProduct />} />
          <Route path="seller-orders" element={<SellerOrders />} />
          <Route path="seller-coupons" element={<SellerCoupons />} />
          <Route path="seller-analytics" element={<SellerAnalytics />} />
          <Route path="payment-result" element={<PaymentResult />} />

          <Route path="profile" element={<Profile />} />
          <Route path="shop/:sellerId" element={<Shop />} />
          <Route path="order/:orderId" element={<OrderDetail />} />
          
          {/* Admin Routes */}
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/products" element={<AdminProducts />} />
          <Route path="admin/coupons" element={<AdminCoupons />} />
          <Route path="admin/analytics" element={<AdminAnalytics />} />
          <Route path="wishlist" element={<Wishlist />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App