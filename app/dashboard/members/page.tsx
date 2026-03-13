import { DashboardProvider } from "@/components/DashboardContext";
import MemberDetailModal from "@/components/MemberDetailModal";
import PersonCard from "@/components/PersonCard";
import MembersBranchGenerationFilterBar, {
  MembersBranchOption,
} from "@/components/MembersBranchGenerationFilterBar";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type SortKey =
  | "birth_asc"
  | "birth_desc"
  | "name_asc"
  | "name_desc"
  | "generation_asc"
  | "generation_desc"
  | "updated_asc"
  | "updated_desc";

function parseIntParam(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    branch_id?: string;
    generation?: string;
    sort?: SortKey;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const branchId = parseIntParam(sp.branch_id);
  const generation = parseIntParam(sp.generation);
  const sort: SortKey = (sp.sort as SortKey) ?? "birth_asc";
  const page = Math.max(1, parseIntParam(sp.page) ?? 1);
  const pageSize = 50;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const canEdit = profile?.role === "admin" || profile?.role === "editor";

  const { data: branchesData } = await supabase
    .from("branches")
    .select("id, name, code")
    .order("code", { ascending: true, nullsFirst: true });

  const branches = (branchesData ?? []) as MembersBranchOption[];

  let personsQuery = supabase.from("persons").select("*", { count: "exact" });

  if (q) {
    // Search name + other_names (safe OR)
    const escaped = q.replaceAll("%", "\\%").replaceAll("_", "\\_");
    personsQuery = personsQuery.or(
      `full_name.ilike.%${escaped}%,other_names.ilike.%${escaped}%`,
    );
  }
  if (branchId != null) personsQuery = personsQuery.eq("branch_id", branchId);
  if (generation != null)
    personsQuery = personsQuery.eq("generation", generation);

  switch (sort) {
    case "name_asc":
      personsQuery = personsQuery.order("full_name", { ascending: true });
      break;
    case "name_desc":
      personsQuery = personsQuery.order("full_name", { ascending: false });
      break;
    case "birth_desc":
      personsQuery = personsQuery.order("birth_year", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "generation_asc":
      personsQuery = personsQuery.order("generation", {
        ascending: true,
        nullsFirst: true,
      });
      break;
    case "generation_desc":
      personsQuery = personsQuery.order("generation", {
        ascending: false,
        nullsFirst: true,
      });
      break;
    case "updated_asc":
      personsQuery = personsQuery.order("updated_at", { ascending: true });
      break;
    case "updated_desc":
      personsQuery = personsQuery.order("updated_at", { ascending: false });
      break;
    case "birth_asc":
    default:
      personsQuery = personsQuery.order("birth_year", {
        ascending: true,
        nullsFirst: false,
      });
      break;
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: persons, count } = await personsQuery.range(from, to);
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildPageHref = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (branchId != null) u.set("branch_id", String(branchId));
    if (generation != null) u.set("generation", String(generation));
    if (sort) u.set("sort", sort);
    if (p > 1) u.set("page", String(p));
    return `/dashboard/members?${u.toString()}`;
  };

  return (
    <DashboardProvider>
      <main className="flex-1 overflow-auto bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Lọc thành viên theo chi / thế hệ
              </h1>
              <p className="text-sm text-stone-600 mt-1">
                Tổng: <span className="font-semibold">{total}</span> thành viên
                {branchId != null && (
                  <span className="ml-2 text-stone-500">(đã lọc chi)</span>
                )}
                {generation != null && (
                  <span className="ml-2 text-stone-500">(đã lọc đời)</span>
                )}
              </p>
            </div>
            {canEdit && (
              <a href="/dashboard/members/new" className="btn-primary">
                Thêm thành viên
              </a>
            )}
          </div>

          <MembersBranchGenerationFilterBar branches={branches} />

          {persons && persons.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {persons.map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400 italic">
              Không tìm thấy thành viên phù hợp.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <a
                href={buildPageHref(Math.max(1, page - 1))}
                aria-disabled={page === 1}
                className={`px-3 py-2 border border-stone-300 rounded-lg transition-colors ${
                  page === 1
                    ? "opacity-50 pointer-events-none"
                    : "hover:bg-stone-50"
                }`}
              >
                Trước
              </a>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <a
                      key={p}
                      href={buildPageHref(p)}
                      className={`w-10 h-10 rounded-lg border transition-colors flex items-center justify-center ${
                        page === p
                          ? "bg-amber-500 text-white border-amber-500"
                          : "border-stone-300 hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      {p}
                    </a>
                  ),
                )}
              </div>
              <a
                href={buildPageHref(Math.min(totalPages, page + 1))}
                aria-disabled={page === totalPages}
                className={`px-3 py-2 border border-stone-300 rounded-lg transition-colors ${
                  page === totalPages
                    ? "opacity-50 pointer-events-none"
                    : "hover:bg-stone-50"
                }`}
              >
                Sau
              </a>
            </div>
          )}
        </div>
      </main>

      <MemberDetailModal />
    </DashboardProvider>
  );
}
