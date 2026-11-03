import { CircleHelp } from "lucide-react";

/**
 * Liên kết tới bài hướng dẫn (VitePress, phục vụ tại /help).
 * slug: đường dẫn bài, ví dụ "xem/thu-vien-anh" -> /help/xem/thu-vien-anh.html; bỏ trống -> trang đầu.
 * Mở tab mới để không mất dữ liệu đang nhập trên màn hình.
 */
export function helpHref(slug?: string) {
  return slug ? `/help/${slug.replace(/^\/+|\.html$/g, "")}.html` : "/help/";
}

export default function HelpLink({
  slug,
  label = "Hướng dẫn",
  className = "",
}: {
  slug?: string;
  label?: string;
  className?: string;
}) {
  return (
    <a
      href={helpHref(slug)}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline ${className}`}
    >
      <CircleHelp className="size-4" />
      {label}
    </a>
  );
}
