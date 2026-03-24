import KinshipFinder from "@/components/KinshipFinder";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Tra cứu danh xưng",
};

export default async function KinshipPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Helper to fetch all records bypassing the 1000 limit
  async function fetchAll(table: string, columns: string, orderColumn?: string) {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      let query = supabase.from(table).select(columns).range(page * pageSize, (page + 1) * pageSize - 1);
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

  const persons = await fetchAll("persons", "id, full_name, gender, birth_year, birth_order, generation, is_in_law", "birth_year");
  const relationships = await fetchAll("relationships", "type, person_a, person_b");

  return (
    <div className="flex-1 w-full relative flex flex-col pb-12">
      <div className="w-full relative z-20 py-6 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">
          Tra cứu danh xưng
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          Chọn hai thành viên để tự động tính cách gọi theo quan hệ gia phả
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <KinshipFinder
          persons={persons ?? []}
          relationships={relationships ?? []}
        />
      </main>
    </div>
  );
}
