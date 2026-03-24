import LineageManager from "@/components/LineageManager";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LineagePage() {
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Helper to fetch all records bypassing the 1000 limit
  async function fetchAll(table: string, orderColumn?: string) {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      let query = supabase.from(table).select("*").range(page * pageSize, (page + 1) * pageSize - 1);
      if (orderColumn) {
        query = query.order(orderColumn, { ascending: true, nullsFirst: false });
      }
      const { data, error } = await query;
      if (error) break;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
      } else { break; }
      page++;
    }
    return allData;
  }

  const personsData = await fetchAll("persons", "birth_year");
  const relsData = await fetchAll("relationships");

  const persons = personsData || [];
  const relationships = relsData || [];

  return (
    <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col pt-8 relative w-full">
      <div className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8 w-full relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-stone-800 tracking-tight">
            Thứ tự gia phả
          </h2>
          <p className="text-stone-500 mt-2 text-sm sm:text-base max-w-2xl">
            Tự động tính toán và cập nhật{" "}
            <strong className="text-stone-700">thế hệ</strong> (đời thứ mấy tính
            từ tổ) và <strong className="text-stone-700">thứ tự sinh</strong>{" "}
            (con trưởng, con thứ…) cho tất cả thành viên. Xem preview trước khi
            áp dụng.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌳</span>
              <div>
                <h3 className="font-bold text-stone-800 text-sm mb-1">
                  Thế hệ (Generation)
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed">
                  Dùng thuật toán BFS từ các tổ tiên gốc (người chưa có thông
                  tin bố/mẹ trong hệ thống). Tổ tiên = Đời 1, con = Đời 2, cháu
                  = Đời 3... Con dâu/rể kế thừa đời của người bạn đời.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl p-5 border border-stone-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">👶</span>
              <div>
                <h3 className="font-bold text-stone-800 text-sm mb-1">
                  Thứ tự sinh (Birth Order)
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed">
                  Trong danh sách anh/chị/em cùng cha, sắp xếp theo năm sinh
                  tăng dần và gán số thứ tự 1, 2, 3... Con dâu/rể không được
                  tính thứ tự.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Manager */}
        <div className="bg-white/80 rounded-2xl border border-stone-200/60 shadow-sm p-5 sm:p-8">
          <LineageManager persons={persons} relationships={relationships} />
        </div>
      </div>
    </main>
  );
}
