# Web tri ân 20/11

Next.js App Router + React + Tailwind CSS 4 + MongoDB Atlas. Frontend và API cùng một ứng dụng; dữ liệu dùng chung giữa thiết bị, không còn lưu localStorage. Banner lấy từ PDF người dùng cung cấp.

## Chạy với MongoDB Atlas

Yêu cầu Node.js >=22 và npm.

1. Trong Atlas, tạo cluster và database user chỉ có quyền `readWrite` với database `tri_an_20_11`.
2. Thêm IP máy chạy ứng dụng vào Network Access. Khi deploy, cấu hình IP outbound theo nhà cung cấp hosting.
3. Chọn Connect → Drivers → Node.js và sao chép connection string. Thay user, mật khẩu; URL-encode ký tự đặc biệt trong mật khẩu.
4. Sao chép `.env.example` thành `.env.local`, điền `MONGODB_URI` và giữ `MONGODB_DB=tri_an_20_11`. File này đã được gitignore. Không đặt URI trong biến `NEXT_PUBLIC_*`.
5. Chạy:

```powershell
npm ci
npm run dev
```

Mở http://localhost:3000. API `/api/health` trả về 200 khi Atlas kết nối được, 503 khi chưa có cấu hình hoặc không kết nối được. Giao diện vẫn mở được khi chưa có Atlas và hiển thị nút thử lại; gửi thất bại giữ nguyên nội dung biểu mẫu.

Atlas hướng dẫn chính thức: https://www.mongodb.com/docs/atlas/driver-connection/

## Chức năng

- Banner và tone kem/vàng, đỏ/cam, cyan theo PDF; giao diện responsive.
- Gửi lời tri ân; tên người gửi, thầy cô, nội dung và thời gian được lưu MongoDB.
- Đọc lời nhắn mới nhất, tìm theo tên/nội dung, phân trang 12 thiệp.
- Cửa sổ đọc đầy đủ, trạng thái tải, trạng thái trống, thử lại khi lỗi.
- Kiểm tra nội dung ở cả frontend/backend, không render HTML từ lời nhắn.
- Giới hạn JSON 16 KB và tổng 60 lần gửi/phút bằng bộ đếm MongoDB, dùng chung giữa các instance. Đây là hạn mức chung, chưa có CAPTCHA hoặc tài khoản người gửi.
- Lời nhắn mới chờ Admin duyệt trước khi hiển thị. Các bài cũ chưa có trạng thái vẫn công khai. Trang `/admin` có đăng nhập, tìm kiếm, lọc, tạo/sửa, duyệt, ẩn/khôi phục bài và đổi mật khẩu.

Không tự đưa dữ liệu cũ trong localStorage lên cloud. Không tạo lời chúc giả trong database.

## API

| Method | URL | Ý nghĩa |
| --- | --- | --- |
| GET | `/api/tributes?q=&page=1` | `{items,total,page,pageSize,pages}` |
| POST | `/api/tributes` | JSON `{sender,teacher,message}`, trả 201 và `{item}` |
| GET | `/api/health` | Kiểm tra kết nối MongoDB |

Tên người gửi: 1–70 ký tự; thầy cô: 1–100; nội dung: 10–2000. Chỉ ba trường này được nhận, thời gian do server tạo. Không có API xóa/sửa công khai.

MongoDB collections: `tributes` (index thời gian), `write_windows` (TTL dọn bộ đếm). Chỉ server đọc `MONGODB_URI`; không trả lỗi driver hoặc credentials ra trình duyệt.

## Kiểm thử

```powershell
npm test
npm run test:integration
npm run build
```

Integration test khởi động MongoDB tạm thật bằng `mongodb-memory-server`, kiểm tra API → lưu database → đọc lại, tìm kiếm, phân trang và hạn mức gửi. Lần đầu cần mạng để tải MongoDB binary; không dùng hoặc thay đổi cluster Atlas của bạn.

## Triển khai

Chạy trên hosting hỗ trợ Next.js Node runtime và kết nối outbound đến MongoDB Atlas. Thêm hai biến môi trường như `.env.example` vào hosting rồi chạy `npm ci`, `npm run build`, `npm start`. Dùng HTTPS cho bản public.

Hoặc Docker (đọc `.env.local` lúc chạy, không đưa secret vào image):

```powershell
docker compose up --build -d
```

Địa chỉ http://localhost:3000. Docker dùng `output: standalone` của Next.js.

Link Sites đã gửi trong cuộc trò chuyện là bản HTML trước đây; chưa được thay bằng bản Next.js/MongoDB này. Sites không hỗ trợ raw TCP mà MongoDB driver cần. `.openai/hosting.json` giữ ID bản Sites cũ để tránh tạo nhầm site; không dùng manifest đó để deploy bản Next.js này.

Tài liệu stack: https://nextjs.org/docs/app/getting-started/installation và https://tailwindcss.com/docs/installation/framework-guides/nextjs

## Khôi phục khi tải danh sách bị gián đoạn

Frontend thử lại GET một lần khi lỗi mạng/502/503/504; mỗi lượt chờ tối đa 10 giây. Bản danh sách tải thành công được lưu trong sessionStorage của tab tối đa 5 phút (tối đa 10 trang/từ khóa), luôn thử cập nhật từ API và có nhãn khi đang dùng bản cũ. Dữ liệu chính vẫn là MongoDB; không tự tạo bản ghi offline hoặc tự gửi lại POST. MongoDB có giới hạn thời gian chờ kết nối và truy vấn. Cơ chế này giảm ảnh hưởng của lỗi tạm thời; không thay thế việc xử lý lỗi TLS hoặc Atlas IP Access List. Sau khi sửa mã, khởi động lại `npm run dev`.

## Tài khoản quản trị

Trang đăng nhập: http://localhost:3000/admin.

```powershell
npm run admin:create
```

Lệnh tạo username `admin`, mật khẩu ngẫu nhiên được in đúng lúc cấu hình lần đầu. Lưu mật khẩu đó để đăng nhập. Hash mật khẩu (scrypt với salt ngẫu nhiên) được giữ trong `.env.local` qua `ADMIN_BOOTSTRAP_USERNAME` và `ADMIN_BOOTSTRAP_PASSWORD_HASH`, chỉ server đọc. Không có API đăng ký Admin công khai. Không đưa các biến này vào `NEXT_PUBLIC_*`.

Nếu Atlas đang mất kết nối, tài khoản được cấu hình ở server và tự tạo vào collection `admins` khi kết nối phục hồi. Chạy lại lệnh không thay mật khẩu tài khoản đã tồn tại. Sau khi deploy sang hosting khác, cấu hình URI Atlas và các biến bootstrap trong môi trường server nếu cần khởi tạo; không đóng gói `.env.local` vào source hoặc Docker image. Có thể bỏ hai biến bootstrap sau khi xác nhận tài khoản đã tồn tại trong Atlas.

Phiên đăng nhập 8 giờ, cookie HttpOnly và SameSite Strict; production dùng cookie Secure qua HTTPS. Session token ngẫu nhiên chỉ được lưu dạng hash trong MongoDB. API quản trị kiểm tra phiên/role ở backend và kiểm tra Origin cho thao tác ghi; giới hạn 10 lần thử đăng nhập mỗi username trong 15 phút. Đổi mật khẩu cần mật khẩu hiện tại, mật khẩu mới tối thiểu 12 ký tự và thu hồi tất cả session.

Bài gửi từ trang công khai có `status=pending`. Chọn Chờ duyệt → Duyệt / Hiển thị để đăng, Ẩn bài để gỡ khỏi trang công khai, hoặc khôi phục bằng Duyệt / Hiển thị. Không xóa vĩnh viễn bản ghi từ trang quản trị. Các bản sao đã tải trong tab của khách có thể tồn tại tối đa 5 phút nếu kết nối đang gián đoạn.

Các thao tác POST `/api/admin/tributes` và PATCH `/api/admin/tributes/:id` nhận tên người gửi, người nhận, nội dung, trạng thái. Danh sách `/api/admin/tributes` chỉ được đọc khi đăng nhập. Thử nghiệm auth và moderation: `npm run test:integration`.

## Form thiệp tri ân

Form hai cột: thiệp xem trước trực tiếp, ba mẫu Garden/Blush/Sky; thông tin thầy cô, nội dung, người gửi. Tối đa 100 từ và 2000 ký tự, được kiểm tra cả server. Email người gửi/người nhận là tùy chọn, chỉ Admin thấy và không trả về danh sách công khai. Hiện chưa tích hợp dịch vụ gửi email tự động. Trường `design` được lưu MongoDB và dùng khi hiển thị thiệp sau duyệt. Giao diện điện thoại xếp form trước, thiệp xem trước phía dưới.
