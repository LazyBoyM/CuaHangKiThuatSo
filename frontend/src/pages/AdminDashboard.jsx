import { Link } from 'react-router-dom'
import Card from '../components/Card'

export default function AdminDashboard() {
  const menuItems = [
    {
        title: 'Thống kê & Báo cáo',
        description: 'Xem biểu đồ doanh thu, sản phẩm bán chạy',
        path: '/admin/analytics',
        color: 'blue'
      },
    {
      
      title: 'Quản lý người dùng',
      description: 'Xem danh sách, khóa/mở khóa tài khoản',
      path: '/admin/users',
      color: 'blue'
    },
    {
      title: 'Duyệt sản phẩm',
      description: 'Phê duyệt hoặc từ chối sản phẩm mới',
      path: '/admin/products',
      color: 'green'
    },
    {
      title: 'Mã giảm giá',
      description: 'Quản lý mã giảm giá toàn sàn',
      path: '/admin/coupons',
      color: 'purple'
    }
  ]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Quản trị hệ thống</h1>
      
      <div className="grid gap-4">
        {menuItems.map((item, index) => (
          <Link key={index} to={item.path}>
            <Card hover className="transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                    ${item.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                      item.color === 'green' ? 'bg-green-100 text-green-600' : 
                      'bg-purple-100 text-purple-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.color === 'blue' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      ) : item.color === 'green' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">{item.title}</h2>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Gợi ý */}
      <Card className="mt-6 bg-gray-50">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Gợi ý:</span> Sử dụng menu trên để quản lý người dùng, duyệt sản phẩm hoặc quản lý mã giảm giá.
        </p>
      </Card>
    </div>
  )
}