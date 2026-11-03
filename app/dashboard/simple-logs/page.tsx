import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SimpleLogsClient from "./SimpleLogsClient";

export const metadata = {
  title: "Nhật ký hoạt động",
};

// Chỉ Quản trị viên được xem nhật ký (kiểm tra phía server, không chỉ ẩn khỏi menu).
export default async function SimpleLogsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || !profile?.is_active) {
    redirect("/dashboard");
  }

  return <SimpleLogsClient />;
}
