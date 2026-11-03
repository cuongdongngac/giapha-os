# Trang hướng dẫn (VitePress)

Viết cho người cao tuổi: câu ngắn, mỗi bước một ý, tên nút **in đậm** đúng như trên màn hình. CSS trong `.vitepress/theme/custom.css` để chữ to (19px).

- Viết bài: thêm file `.md` vào `bat-dau/`, `xem/`, `cap-nhat/`, `quan-tri/`, rồi thêm một dòng vào `sidebar` trong `.vitepress/config.mts`.
- Xem thử khi viết: `npm run help:dev` → http://localhost:5173/help/
- Build: `npm run help:build` (xuất ra `public/help`, đã nằm trong `npm run build`).
- Trong ứng dụng: menu tài khoản có mục **Hướng dẫn sử dụng**; thanh đầu trang công khai có mục **Hướng dẫn**; dùng `<HelpLink slug="xem/thu-vien-anh" />` (`components/HelpLink.tsx`) để gắn link tới một bài.
- Trang hướng dẫn là **công khai** (không cần đăng nhập): **không** đưa ảnh chụp có tên, ngày sinh, số điện thoại người thật trong họ vào đây.

## Ảnh minh hoạ

Hiện các bài chưa có ảnh. Khi thêm, đặt ảnh trong `help/public/images/<nhóm>/` (nhóm trùng tên thư mục bài).

Tên ảnh: `<tên-bài>-<số 2 chữ số>-<mô-tả-không-dấu>[-mobile].png`. Có `-mobile` = chụp khung điện thoại (390px, hiển thị tối đa 340px).

```md
![Mô tả](/images/xem/thu-vien-anh-01-luoi-mobile.png)
<p class="img-caption">Hình 1: Chú thích</p>
```

Nên chụp bằng dữ liệu mẫu `docs/seed.sql` (không dùng dữ liệu thật của họ).
