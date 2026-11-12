import { isPreRegisteredUser } from "@/utils/auth/isPreRegisteredUser";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

// Nơi Supabase chuyển về sau khi đăng nhập Google xong.
// - Đổi `code` lấy phiên đăng nhập.
// - Chỉ cho phép email đã được admin tạo trước; tài khoản Google lạ bị
//   đăng xuất ngay (và xoá luôn nếu có SUPABASE_SERVICE_ROLE_KEY).
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");
  const next = getSafeNextPath(url.searchParams.get("next"));

  const loginWithError = (errorCode: "oauth" | "not-registered") => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorCode);
    return NextResponse.redirect(loginUrl);
  };

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ) {
    return NextResponse.redirect(new URL("/missing-db-config", request.url));
  }

  // Người dùng từ chối cấp quyền, hoặc Supabase tắt đăng ký mới, ...
  if (oauthError || !code) {
    return loginWithError("oauth");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return loginWithError("oauth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return loginWithError("oauth");
  }

  if (!isPreRegisteredUser(user)) {
    // Email chưa được admin tạo: không cho vào, dọn tài khoản vừa tự sinh.
    await tryDeleteJustCreatedUser(user.id);
    await supabase.auth.signOut();
    return loginWithError("not-registered");
  }

  return NextResponse.redirect(new URL(next, request.url));
}

// Chỉ cho chuyển tiếp nội bộ ("/dashboard", ...), chống open-redirect.
function getSafeNextPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

// Xoá tài khoản auth.users vừa được OAuth tự sinh (profiles đi kèm tự xoá
// theo ON DELETE CASCADE). Chỉ là dọn dẹp: quyền truy cập đã bị chặn ở trên,
// nên thất bại ở đây không ảnh hưởng bảo mật.
async function tryDeleteJustCreatedUser(userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) return;

    const { createClient: createAdminClient } = await import(
      "@supabase/supabase-js"
    );
    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await adminClient.auth.admin.deleteUser(userId);
  } catch {
    // Bỏ qua: tài khoản mồ côi vẫn bị chặn ở mọi lần đăng nhập sau.
  }
}
