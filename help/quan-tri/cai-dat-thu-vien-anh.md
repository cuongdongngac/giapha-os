# Bật Thư viện ảnh (cài đặt)

Làm **một lần** khi mới cập nhật lên phiên bản có Thư viện ảnh. Nếu chưa làm, trang Thư viện ảnh sẽ báo **Chưa bật Thư viện ảnh**.

::: tip Cài mới từ đầu?
Nếu đang dựng gia phả **mới tinh**, chỉ cần chạy `docs/schema.sql` (trang `/setup` hiện sẵn để copy) — đã có sẵn Thư viện ảnh, bỏ qua bài này.
:::

1. Đăng nhập [Supabase](https://supabase.com), mở dự án của gia phả.
2. Vào **SQL Editor** → **New query**.
3. Mở file `supabase/migrations/20261103000000_gallery.sql` trong mã nguồn, **sao chép toàn bộ**, dán vào, bấm **Run**.
4. Làm tiếp như vậy với file `supabase/migrations/20261103010000_security_fixes.sql` (bản vá phân quyền). Cuối file có bảng liệt kê các quy tắc quyền để rà lại.

Thấy “Success” là xong. Chạy lại nhiều lần cũng không sao.

File thư viện ảnh tạo:

- Bảng **`gallery_items`** lưu thông tin ảnh (tiêu đề, album, ngày, chi, người trong ảnh, công khai/nội bộ…).
- Thư mục lưu ảnh **`gallery`** trong Storage (tối đa 10MB/ảnh sau khi nén, chỉ nhận JPG/PNG/WEBP/GIF).
- Quy tắc quyền: **Admin, Editor** được đăng ảnh; người đăng tự sửa/xoá ảnh của mình; **Admin** sửa/xoá mọi ảnh; ảnh **nội bộ** chỉ tài khoản đã duyệt xem được.

::: warning Ảnh “nội bộ” vẫn có đường link công khai
Ảnh nội bộ bị **ẩn khỏi thư viện** với khách, nhưng ai **có sẵn đường link trực tiếp** tới file ảnh vẫn mở được (vì thư mục `gallery` để công khai cho tải nhanh). Đừng đăng ảnh giấy tờ tuỳ thân, sổ đỏ… lên thư viện.
:::
