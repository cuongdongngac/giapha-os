import { DashboardProvider } from "@/components/DashboardContext";
import GalleryClient from "@/components/gallery/GalleryClient";
import MemberDetailModal from "@/components/MemberDetailModal";
import { BranchOption, GalleryItem, GalleryPersonRef } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const metadata = {
  title: "Thư viện ảnh dòng họ",
  description: "Lưu giữ và chia sẻ hình ảnh, kỷ niệm của dòng họ",
};

export default async function GalleryPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role, is_active").eq("id", user.id).single()
    : { data: null };

  const isActive = !!profile?.is_active;
  const isAdmin = isActive && profile?.role === "admin";
  const canUpload = isActive && (profile?.role === "admin" || profile?.role === "editor");

  const { data: itemsData, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Bảng chưa được tạo (chưa chạy migration)
  const missingTable = !!error && (error.code === "42P01" || error.code === "PGRST205");

  const items = (itemsData as GalleryItem[] | null) ?? [];

  // Chỉ lấy tên những người được gắn trong ảnh
  const personIds = Array.from(new Set(items.flatMap((i) => i.person_ids ?? [])));
  let persons: GalleryPersonRef[] = [];
  if (personIds.length > 0) {
    const { data } = await supabase.from("persons").select("id, full_name").in("id", personIds);
    persons = (data as GalleryPersonRef[] | null) ?? [];
  }

  const { data: branchesData } = await supabase.from("branches").select("id, name").order("code");
  const branches = (branchesData as BranchOption[] | null) ?? [];

  return (
    <DashboardProvider>
      <main className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full">
        {missingTable ? (
          <div className="max-w-xl mx-auto mt-10 bg-amber-50 border border-amber-200 rounded-2xl p-6 text-stone-700">
            <h1 className="text-xl font-serif font-bold text-stone-800 mb-2">Chưa bật Thư viện ảnh</h1>
            <p className="text-sm leading-relaxed">
              Cơ sở dữ liệu chưa có bảng <code>gallery_items</code>. Quản trị viên cần chạy file{" "}
              <code>supabase/migrations/20261103000000_gallery.sql</code> rồi{" "}
              <code>20261103010000_security_fixes.sql</code> trong Supabase → SQL Editor.
            </p>
          </div>
        ) : (
          <GalleryClient
            initialItems={items}
            persons={persons}
            branches={branches}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
            canUpload={canUpload}
            isLoggedIn={!!user}
          />
        )}
      </main>
      <MemberDetailModal />
    </DashboardProvider>
  );
}
