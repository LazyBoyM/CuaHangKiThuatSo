# BÁO CÁO KỸ THUẬT: HỆ THỐNG DIGITAL MARKETPLACE MICROSERVICES

## 1. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
Hệ thống được xây dựng theo mô hình **Event-driven Microservices**, tách biệt hoàn toàn các logic nghiệp vụ để tối ưu hóa hiệu năng và khả năng bảo trì.

### 1.1 Quản lý Luồng (API Gateway)
*   **Công nghệ**: Nginx Reverse Proxy.
*   **Vai trò**: Là chốt chặn duy nhất, thực hiện điều hướng request (Routing) dựa trên đường dẫn (ví dụ: `/api/users` -> `user-service`). Giúp che giấu cấu trúc IP nội bộ của các microservices, tăng tính bảo mật.

### 1.2 Chi tiết các Microservices
1.  **User Service (Port 5001)**:
    *   **Logic**: Quản lý Authentication (Đăng ký/Đăng nhập), Authorization (Phân quyền Admin/Seller/Buyer).
    *   **Điểm đặc biệt**: Tích hợp logic "Shop Profile" cho Seller, xử lý định danh thương hiệu (Brand Identity) đồng nhất toàn sàn.
2.  **Product Service (Port 5002)**:
    *   **Logic**: Quản lý vòng đời sản phẩm (Tạo -> Chờ duyệt -> Hiển thị).
    *   **Tính năng nâng cao**: Hệ thống lọc theo danh mục, quản lý file kỹ thuật số (Downloadable assets), quản lý Wishlist.
3.  **Order Service (Port 5003)**:
    *   **Logic**: Xử lý giao dịch và tạo Token tải xuống (Download Token) duy nhất cho mỗi đơn hàng.
    *   **Cơ chế tài chính**: Tự động tính toán `Platform Fee` (Phí sàn) và `Seller Net Amount` (Thực thu của người bán) ngay khi đơn hàng được tạo.
4.  **Payment Service (Port 5004)**:
    *   **Logic**: Cầu nối giữa hệ thống và cổng thanh toán MoMo.
    *   **Bảo mật**: Xử lý IPN (Instant Payment Notification) từ MoMo bằng chữ ký số (Signature validation) để ngăn chặn gian lận số tiền.
5.  **Chat Service (Port 5005)**:
    *   **Công nghệ**: Socket.io + Redis (Optional).
    *   **Logic**: Lưu trữ tin nhắn giữa Buyer và Seller, hỗ trợ hiển thị trạng thái "đang soạn tin" và thông báo tin nhắn mới real-time.
6.  **Coupon Service (Port 5006)**:
    *   **Logic**: Kiểm tra mã giảm giá dựa trên: Loại mã (Toàn sàn/Shop), Ngày hết hạn, Số lần dùng tối đa, và tính hợp lệ với sản phẩm trong giỏ hàng.
7.  **Review Service (Port 5007)**:
    *   **Logic**: Thu thập đánh giá và xếp hạng sao (Rating). Chỉ cho phép người đã mua sản phẩm (có đơn hàng thành công) được gửi đánh giá.

---

## 2. CƠ CHẾ BẢO MẬT & XÁC THỰC (SECURITY MECHANISMS)
### 2.1 Xác thực người dùng (User Authentication)
Sử dụng **JWT (JSON Web Token)**. Khi người dùng đăng nhập, `user-service` cấp một Token chứa thông tin `userId`, `role` và `displayName`. Token này được gửi kèm trong Header của mọi request tiếp theo.

### 2.2 Bảo mật nội bộ (Inter-service Security)
Các service gọi nhau (ví dụ: `order-service` gọi `product-service`) không thông qua Gateway mà gọi trực tiếp qua mạng nội bộ Docker. Mỗi request nội bộ đều phải đính kèm `x-internal-secret` (Internal Secret Key). Nếu Key này không khớp, request sẽ bị từ chối ngay lập tức (HTTP 401).

---

## 3. CÁC LUỒNG DỮ LIỆU PHỨC TẠP (COMPLEX DATA FLOWS)
### 3.1 Luồng Thanh toán & Hoàn tất Đơn hàng
1.  **Buyer** nhấn "Mua ngay" -> `payment-service` tạo yêu cầu thanh toán MoMo.
2.  Sau khi thanh toán, MoMo gửi **IPN** về `payment-service`.
3.  `payment-service` xác thực chữ ký MoMo -> Gọi `coupon-service` (để trừ lượt dùng mã) -> Gọi `order-service` (để tạo đơn hàng).
4.  `order-service` sau khi tạo đơn -> Gọi `product-service` (để tăng số lượng bán) -> Gọi `user-service` (để gửi thông báo Real-time cho Seller).

### 3.2 Luồng Đồng bộ Định danh Shop (Identity Sync)
Để đảm bảo Chat hiển thị đúng tên Shop thay vì tên tài khoản cá nhân:
*   `chat-service` khi nhận tin nhắn sẽ không lấy tên từ Socket mà gọi API nội bộ tới `user-service` để lấy `displayName` (Shop Name) mới nhất từ Cache/DB.

---

## 4. TỐI ƯU HÓA HIỆU NĂNG (PERFORMANCE OPTIMIZATIONS)
*   **Ref-based Caching (Frontend)**: Trong `ChatWidget`, sử dụng `useRef` để lưu trữ thông tin người dùng đã fetch, tránh việc gọi API lặp lại hàng trăm lần khi có tin nhắn mới.
*   **Database Isolation**: Mỗi service dùng DB riêng, giúp giảm tải (lock contention) và cho phép mỗi service dùng một cấu hình DB tối ưu khác nhau.
*   **Non-blocking IO**: Backend sử dụng cơ chế Async/Await của Node.js giúp xử lý hàng ngàn request đồng thời mà không bị nghẽn mạch.

---

## 5. THỐNG KÊ & BÁO CÁO (ANALYTICS)
*   **Admin Dashboard**: Tổng hợp dữ liệu từ các service để hiển thị:
    *   Biểu đồ doanh thu 7 ngày (Chart.js).
    *   Top 5 sản phẩm bán chạy nhất hệ thống.
    *   Tổng lợi nhuận sàn thu được từ phí giao dịch.
*   **Seller Dashboard**: Theo dõi số đơn hàng, doanh thu thực nhận và quản lý trạng thái sản phẩm (Chờ duyệt/Đã duyệt).

---

## 6. KẾT LUẬN
Dự án không chỉ là một trang web bán hàng đơn thuần, mà là một **hệ thống phân tán (Distributed System)** hoàn chỉnh. Nó giải quyết các bài toán thực tế về tính nhất quán dữ liệu, bảo mật thanh toán và trải nghiệm người dùng thời gian thực.
