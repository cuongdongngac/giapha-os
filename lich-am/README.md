# Lịch Âm Dòng Họ

Ứng dụng lịch âm cho dòng họ:

- **Lịch âm–dương** theo giờ Việt Nam: can chi, tiết khí, giờ hoàng đạo, các ngày lễ tết, Thanh minh.
- **Thông tin chung** lấy từ Google Sheet: ngày giỗ, sự kiện dòng họ, danh bạ. Ai được quyền sửa Sheet thì cứ sửa, mọi người bấm ⟳ là thấy bản mới. Dữ liệu được lưu lại nên mất mạng vẫn xem được.
- **Ghi chú riêng** của từng người: chỉ lưu trên điện thoại của người đó.
- **Nhắc nhở** trước ngày giỗ, ngày sự kiện (chỉ có trên bản APK).

## 1. Chuẩn bị Google Sheet

1. Mở tệp `Lich-Ho-Pham-Du-lieu-chung.xlsx` (trong thư mục này) bằng Google Sheets: tải tệp lên Google Drive, mở ra, rồi chọn **Tệp → Lưu dưới dạng Google Trang tính**.
2. Giữ **đúng tên 4 tab**: `Ngày giỗ`, `Sự kiện`, `Danh bạ`, `Cài đặt`. Tên cột có thể đổi thứ tự, nhưng giữ đúng chữ.
3. Xóa các dòng bắt đầu bằng "Ví dụ:" (app cũng tự bỏ qua những dòng này).
4. Bấm **Chia sẻ → Quyền truy cập chung → Bất kỳ ai có đường liên kết → Người xem**. Chỉ những người bạn thêm vào với quyền **Người chỉnh sửa** mới sửa được.
5. Sao chép đường link của Sheet.

Quy ước nhập liệu:

| Tab | Ghi chú |
|---|---|
| Ngày giỗ | Nhập **trực tiếp ngày/tháng âm**. Cột "Tháng nhuận" ghi `Có` nếu cụ mất vào tháng nhuận. Năm đó không có tháng nhuận thì app tính vào tháng thường. Giỗ ngày 30 mà tháng đó chỉ có 29 ngày thì app hiện vào ngày 29. |
| Sự kiện | "Loại lịch" ghi `Âm` hoặc `Dương`. **Để trống cột Năm** thì sự kiện lặp lại hằng năm. Ghi năm thì chỉ diễn ra năm đó. |
| Danh bạ | Nên định dạng cột Điện thoại là **văn bản thuần túy** (Định dạng → Số → Văn bản thuần túy) để không mất số 0 ở đầu. App cũng tự thêm lại số 0 nếu bị mất. |
| Cài đặt | Tên dòng họ, link trang gia phả, một dòng thông báo chung, số ngày nhắc trước. Sửa ở đây thì app của mọi người đổi theo. |

## 2. Gắn link Sheet vào app

Mở `www/config.js` và dán link vào `sheetUrl` (và `giaPhaUrl` nếu muốn). Làm vậy thì họ hàng cài app là có dữ liệu ngay. Nếu không, mỗi người phải tự dán link vào mục **Cài đặt** trong app.

## 3. Build APK bằng GitHub (không cần cài Android Studio)

Thư mục này nằm trong repo `giapha-os`.

0. **Một lần duy nhất:** chép tệp `lich-am/build-lich-apk.yml` sang `giapha-os/.github/workflows/build-lich-apk.yml` (tạo thư mục `workflows` nếu chưa có).

1. **Thêm khóa ký một lần.** Khóa này giúp các bản cập nhật sau cài đè được lên bản cũ. Vào repo trên GitHub → **Settings → Secrets and variables → Actions → New repository secret**:
   - Name: `ANDROID_DEBUG_KEYSTORE`
   - Secret: dán toàn bộ nội dung tệp `ANDROID_DEBUG_KEYSTORE.txt`

   Hãy cất tệp `.keystore` và `.txt` ở nơi an toàn. **Không** đưa hai tệp này lên GitHub.
2. Commit và push thư mục `lich-am` cùng tệp `.github/workflows/build-lich-apk.yml` lên GitHub.
3. Vào tab **Actions → Build Lịch Âm APK**. Lần build tự chạy khi push, hoặc bấm **Run workflow** để chạy tay. Chờ khoảng 5 phút.
4. Mở lần chạy vừa xong, kéo xuống mục **Artifacts** và tải `lich-ho-pham-apk` về (đây là tệp zip chứa APK).
5. Gửi tệp APK cho họ hàng. Khi cài, điện thoại sẽ hỏi cho phép cài từ nguồn ngoài: bấm cho phép.

Sau này chỉ cần sửa mã rồi push, GitHub sẽ build lại. Còn **dữ liệu** (ngày giỗ, danh bạ…) thì sửa trong Google Sheet, **không cần build lại**.

## 4. Dùng như trang web (không cần APK)

Thư mục `www/` là một trang web tĩnh. Có thể đưa nó lên bất kỳ đâu (Vercel, Netlify, GitHub Pages) rồi trên điện thoại chọn **"Thêm vào màn hình chính"**. Bản web không có thông báo nhắc nhở.

## Cấu trúc

```
lich-am/
  www/index.html, style.css   giao diện
  www/app.js                  đọc Sheet, lịch, sắp tới, danh bạ, ghi chú, nhắc nhở
  www/lunar.js                âm lịch (thuật toán Hồ Ngọc Đức, UTC+7)
  www/config.js               link Sheet, tên app
  assets/                     ảnh biểu tượng, màn hình chờ
  capacitor.config.json       cấu hình đóng gói Android
```
