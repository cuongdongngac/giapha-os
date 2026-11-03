import { updateSession } from "@/utils/supabase/middleware";
import { type NextRequest } from "next/server";

// Next.js 16: "proxy" (trước đây là middleware) chạy trước mỗi request trang.
// - Làm mới phiên đăng nhập Supabase (cookie) để server component luôn thấy đúng người dùng.
// - Chặn khách vào các trang quản trị, chuyển tới /setup khi DB chưa có bảng.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Bỏ qua (không chạy proxy) cho:
     * - _next/static, _next/image: file build
     * - help/: trang hướng dẫn tĩnh (VitePress)
     * - file PWA: sw.js, manifest, offline.html, icons/, browserconfig
     * - assets/, avatar/, screenshots/ và mọi file ảnh/âm thanh/pdf
     */
    "/((?!_next/static|_next/image|favicon.ico|help/|icons/|assets/|avatar/|screenshots/|sw.js|manifest.webmanifest|site.webmanifest|browserconfig.xml|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|pdf|json|html)$).*)",
  ],
};
