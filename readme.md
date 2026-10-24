# Marketplace - Sàn giao dịch sản phẩm số

Hệ thống Microservice Marketplace cho phép mua bán sản phẩm số (ảnh, video, template, phần mềm, ebook...). Hỗ trợ 3 role: Admin, Seller (Người bán), Buyer (Người mua).

## 🚀 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB (7 instances) |
| Gateway | Nginx |
| Container | Docker + Docker Compose |
| Frontend | React + Vite + Tailwind CSS |
| Thanh toán | MoMo Sandbox |

## 📦 Kiến trúc Microservice

| Service | Port | Mô tả |
|---------|------|-------|
| Nginx Gateway | 5000 | API Gateway |
| User Service | 5001 | Quản lý người dùng, xác thực |
| Product Service | 5002 | Quản lý sản phẩm |
| Order Service | 5003 | Quản lý đơn hàng |
| Payment Service | 5004 | Thanh toán MoMo |
| Review Service | 5005 | Đánh giá sản phẩm |
| Coupon Service | 5006 | Mã giảm giá |
| Chat Service | 5007 | Dịch vụ chat |
| Notification Service | 5008 | Dịch vụ thông báo |

## 🔑 Tài khoản test

| Vai trò | Email | Mật khẩu | Ghi chú |
|---------|-------|----------|---------|
| **Admin** | `admin@market.com` | `123456` | Quản trị hệ thống |
| **Seller** | `seller@demo.com` | `123456` | Người bán (Shop Demo) |
| **Buyer** | `buyer@demo.com` | `123456` | Người mua |

## 🎯 Chức năng theo Role

### 👑 Admin
- Xem tổng quan hệ thống
- Quản lý người dùng (Khóa/Mở khóa)
- Duyệt sản phẩm mới đăng bán
- Quản lý mã giảm giá toàn sàn (Platform)

### 🏪 Seller (Người bán)
- Đăng sản phẩm mới (ảnh, video, template, phần mềm, ebook)
- Quản lý sản phẩm của mình
- Xem đơn bán và doanh thu
- Tạo mã giảm giá cho shop
- Xem đánh giá từ người mua

### 🛒 Buyer (Người mua)
- Khám phá sản phẩm
- Tìm kiếm, lọc sản phẩm
- Xem chi tiết sản phẩm
- Mua hàng qua MoMo Sandbox
- Áp dụng mã giảm giá
- Xem đơn mua

## 🚀 Hướng dẫn chạy



///////////////////
=== Tải Docker ===


### 1. Khởi động Backend

cd C:\Project\marketplace
docker-compose up -d

### 2. Khởi động Frontend

cd frontend
npm install
npm run dev
### 3. Truy cập

Frontend: http://localhost:3000

API Gateway: http://localhost:5000



docker-compose down && docker-compose build --no-cache && docker-compose up -d



### MoMo Payment QR 
1. tải app
https://developers.momo.vn/v3/vi/download/\

tài khoản 0387412923
          123456
          000000
