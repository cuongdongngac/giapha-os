import { defineConfig } from "vitepress";

// Trang hướng dẫn Gia Phả Họ Phạm Đông Ngạc — build ra trang tĩnh, Next.js phục vụ tại /help.
//   npm run help:dev    -> xem thử khi viết bài (http://localhost:5173/help/)
//   npm run help:build  -> xuất ra public/help (tự chạy trong `npm run build`)
// Thêm bài: tạo file .md trong thư mục tương ứng rồi thêm một dòng vào `sidebar` bên dưới.
export default defineConfig({
  lang: "vi-VN",
  title: "Hướng dẫn Gia Phả Họ Phạm",
  description: "Hướng dẫn xem và cập nhật gia phả Họ Phạm Đông Ngạc — viết đơn giản, từng bước",
  base: "/help/",
  outDir: "../public/help",
  cleanUrls: false, // Next.js phục vụ file tĩnh nguyên tên (.html)
  srcExclude: ["README.md"],
  lastUpdated: true,
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["meta", { name: "theme-color", content: "#b45309" }],
  ],

  themeConfig: {
    siteTitle: "Hướng dẫn Gia Phả",
    logo: "/icons/icon-192x192.png",

    nav: [
      { text: "Bắt đầu", link: "/bat-dau/gioi-thieu" },
      { text: "Xem gia phả", link: "/xem/cac-che-do-xem" },
      { text: "Cập nhật", link: "/cap-nhat/them-nguoi" },
      { text: "Quản trị", link: "/quan-tri/tai-khoan" },
      { text: "Hỏi đáp", link: "/hoi-dap" },
    ],

    sidebar: [
      {
        text: "1. Bắt đầu",
        items: [
          { text: "Trang gia phả dùng để làm gì", link: "/bat-dau/gioi-thieu" },
          { text: "Cài lên điện thoại", link: "/bat-dau/cai-ung-dung" },
          { text: "Thao tác cơ bản, menu", link: "/bat-dau/thao-tac-co-ban" },
          { text: "Đăng nhập, đổi mật khẩu", link: "/bat-dau/dang-nhap" },
        ],
      },
      {
        text: "2. Xem gia phả",
        items: [
          { text: "Các cách xem gia phả", link: "/xem/cac-che-do-xem" },
          { text: "Xem thông tin một người", link: "/xem/xem-mot-nguoi" },
          { text: "Sơ đồ cây, Mindmap", link: "/xem/so-do-cay" },
          { text: "Các chi họ, danh nhân", link: "/xem/chi-ho" },
          { text: "Truy nguồn gốc", link: "/xem/truy-nguon-goc" },
          { text: "Hỏi cách xưng hô", link: "/xem/tra-danh-xung" },
          { text: "Ngày giỗ, sinh nhật, sự kiện", link: "/xem/su-kien" },
          { text: "Đổi ngày âm – dương", link: "/xem/doi-ngay-am-duong" },
          { text: "Thống kê dòng họ", link: "/xem/thong-ke" },
          { text: "Bài viết, tài liệu", link: "/xem/bai-viet" },
          { text: "Thư viện ảnh", link: "/xem/thu-vien-anh" },
        ],
      },
      {
        text: "3. Cập nhật gia phả",
        items: [
          { text: "Thêm một người mới", link: "/cap-nhat/them-nguoi" },
          { text: "Sửa thông tin", link: "/cap-nhat/sua-thong-tin" },
          { text: "Thêm vợ/chồng, con cái", link: "/cap-nhat/them-quan-he" },
          { text: "Viết tiểu sử", link: "/cap-nhat/tieu-su" },
          { text: "Thêm sự kiện của họ", link: "/cap-nhat/them-su-kien" },
          { text: "Đăng bài viết", link: "/cap-nhat/viet-bai" },
          { text: "Thêm ảnh vào thư viện", link: "/cap-nhat/them-anh" },
          { text: "Xoá người nhập nhầm", link: "/cap-nhat/xoa" },
        ],
      },
      {
        text: "4. Dành cho người quản trị",
        collapsed: true,
        items: [
          { text: "Quản lý tài khoản, cấp quyền", link: "/quan-tri/tai-khoan" },
          { text: "Quản lý chi họ", link: "/quan-tri/chi-ho" },
          { text: "Tự tính đời, thứ tự sinh", link: "/quan-tri/thu-tu-gia-pha" },
          { text: "Sao lưu & phục hồi", link: "/quan-tri/sao-luu" },
          { text: "Nhật ký hoạt động", link: "/quan-tri/nhat-ky" },
          { text: "Bật Thư viện ảnh (cài đặt)", link: "/quan-tri/cai-dat-thu-vien-anh" },
        ],
      },
      { text: "Hỏi đáp", link: "/hoi-dap" },
    ],

    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Tìm hướng dẫn…", buttonAriaLabel: "Tìm hướng dẫn" },
          modal: {
            noResultsText: "Không tìm thấy kết quả phù hợp",
            resetButtonTitle: "Xóa tìm kiếm",
            footer: { selectText: "chọn", navigateText: "di chuyển", closeText: "đóng" },
          },
        },
      },
    },

    outline: { level: [2, 3], label: "Trong bài này" },
    docFooter: { prev: "Bài trước", next: "Bài tiếp theo" },
    lastUpdated: { text: "Cập nhật lần cuối" },
    darkModeSwitchLabel: "Giao diện",
    sidebarMenuLabel: "Mục lục",
    returnToTopLabel: "Lên đầu trang",
    footer: {
      message: "Gia Phả Họ Phạm Đông Ngạc — hướng dẫn sử dụng",
      copyright: "Ảnh minh hoạ (nếu có) dùng dữ liệu mẫu, không phải người thật.",
    },
  },
});
