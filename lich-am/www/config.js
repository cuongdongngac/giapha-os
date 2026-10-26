/*
 * CẤU HÌNH CHUNG — sửa tệp này trước khi build APK.
 * Dán link Google Sheet vào sheetUrl để họ hàng cài app là có dữ liệu ngay, không phải tự nhập.
 * (Người dùng vẫn có thể đổi link trong mục Cài đặt của app.)
 */
window.LICH_CONFIG = {
  appName: "Lịch Họ Phạm Đông Ngạc",
  sheetUrl: "",
  giaPhaUrl: "",
  // Tên các tab trong Google Sheet (phải khớp đúng tên tab)
  tabs: { gio: "Ngày giỗ", events: "Sự kiện", contacts: "Danh bạ", settings: "Cài đặt" }
};
