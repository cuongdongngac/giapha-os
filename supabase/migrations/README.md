# Cơ sở dữ liệu (Supabase)

## Cài mới

Chạy **một file duy nhất**: `docs/schema.sql` (trang `/setup` của ứng dụng cũng hiện sẵn nội dung file này để copy).
File này đã gộp đủ: bảng, chi họ, tiểu sử, bài viết, thư viện ảnh, phân quyền, storage, các hàm quản trị.
Không cần chạy thêm migration nào.

## Nâng cấp DB đang chạy

Chạy lần lượt trong Supabase → SQL Editor (mỗi file chạy lại nhiều lần vẫn an toàn, không xoá dữ liệu):

1. `20261103000000_gallery.sql` — bật Thư viện ảnh.
2. `20261103010000_security_fixes.sql` — vá phân quyền (Storage `posts`/`avatars`, thông tin riêng tư,
   nhật ký, config) và sửa trigger tạo tài khoản. Cuối file có câu lệnh liệt kê mọi policy — rà xem
   còn policy lạ nào quá lỏng không.

Các file `2024*.sql` là lịch sử, DB đang chạy đã có; không cần chạy lại.

## Các file trong `docs/`

| File | Dùng để |
|---|---|
| `schema.sql` | Schema đầy đủ, chạy được (cài mới / tham chiếu chính) |
| `schema-db-snapshot.sql` | Ảnh chụp cấu trúc DB thật (xuất từ Supabase) — **chỉ để đọc**, không chạy |
| `schemanew.sql` | Bản schema cũ có chi họ/tiểu sử (giữ lại để đối chiếu) |
| `seed.sql` | Dữ liệu mẫu |
| `danger/delete_all_schema.sql` | Xoá sạch schema — **cẩn thận** |
