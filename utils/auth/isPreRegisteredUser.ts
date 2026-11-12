// Đăng nhập Google chỉ dành cho email đã được admin tạo trước trong hệ thống.
//
// Cách nhận biết: tài khoản do admin tạo (hàm SQL admin_create_user) luôn có
// providers ["email"] trong app_metadata. Khi email đó đăng nhập bằng Google,
// Supabase liên kết thêm identity "google" -> ["email", "google"].
// Tài khoản Google hoàn toàn mới chỉ có ["google"] -> bị từ chối.
export interface OAuthUserLike {
  app_metadata?: {
    providers?: string[] | null;
  } | null;
}

export function isPreRegisteredUser(
  user: OAuthUserLike | null | undefined,
): boolean {
  if (!user) return false;
  const providers = user.app_metadata?.providers;
  if (!Array.isArray(providers)) return false;
  return providers.includes("email");
}
