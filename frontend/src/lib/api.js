import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra'
    
    // CHỈ CHUYỂN HƯỚNG KHI TOKEN HẾT HẠN HOẶC KHÔNG HỢP LỆ
    // KHÔNG CHUYỂN HƯỚNG KHI TÀI KHOẢN BỊ BAN
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || ''
      
      // Nếu là lỗi token (không phải lỗi banned)
      if (errorMessage.includes('token') || 
          errorMessage.includes('Token') || 
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('Not authorized')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Chỉ chuyển hướng nếu không phải đang ở trang login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
      // Nếu là lỗi banned thì KHÔNG chuyển hướng, để component xử lý
    }
    
    // Vẫn throw error để component catch được
    return Promise.reject(error)
  }
)

export default api