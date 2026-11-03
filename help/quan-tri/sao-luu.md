# Sao lưu & phục hồi

Menu → **Sao lưu & Phục hồi** (chỉ Quản trị viên).

## Sao lưu dữ liệu

1. Ô **Điểm gốc (Root) để xuất dữ liệu**: để **Toàn bộ dữ liệu**, hoặc chọn một người để chỉ sao lưu nhánh của người đó.
2. Bấm một trong ba nút:
   - **Xuất JSON** — bản đầy đủ nhất, **nên dùng để sao lưu định kỳ**.
   - **Xuất CSV (Zip)** — mở được bằng Excel.
   - **Xuất GEDCOM** — chuyển sang phần mềm gia phả khác.
3. File được tải về máy. **Cất file ở chỗ an toàn** (Google Drive, USB…).

::: tip Bao lâu sao lưu một lần?
Mỗi tháng một lần, và **luôn** sao lưu trước khi làm việc lớn (phục hồi, tính lại thứ tự gia phả, nhập nhiều người).
:::

## Phục hồi dữ liệu

::: danger Xoá toàn bộ dữ liệu hiện tại
Phục hồi sẽ **xoá toàn bộ** thành viên và quan hệ hiện có rồi **thay** bằng dữ liệu trong file. **Không hoàn tác được.**
:::

1. Bấm **Chọn file phục hồi**, chọn file `.json`, `.ged` hoặc `.zip` (file zip phải là file tạo từ **Xuất CSV**).
2. Đọc bảng **Xác nhận phục hồi**, bấm đồng ý (hoặc **Huỷ bỏ**).
3. Chờ **Đang phục hồi...** chạy xong. Trang báo số thành viên và quan hệ đã nhập.

::: info Ảnh, bài viết, tiểu sử
Bản sao lưu này chủ yếu gồm **thành viên và quan hệ**. Bài viết, tiểu sử, ảnh trong Thư viện ảnh nằm ở Supabase — nên bật thêm sao lưu của Supabase (Project → Database → Backups) cho chắc.
:::
