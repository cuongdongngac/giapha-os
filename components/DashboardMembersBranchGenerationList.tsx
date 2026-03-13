"use client";

import PersonCard from "@/components/PersonCard";
import { createClient } from "@/utils/supabase/client";
import { Person } from "@/types";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface BranchRow {
  id: number;
  name: string;
  code: string | null;
  parent_id: number | null;
}

type SortKey =
  | "birth_asc"
  | "birth_desc"
  | "name_asc"
  | "name_desc"
  | "generation_asc"
  | "generation_desc"
  | "updated_asc"
  | "updated_desc";

function buildDescendantSet(
  rootId: number,
  childrenByParent: Map<number, number[]>,
): Set<number> {
  const out = new Set<number>();
  const stack: number[] = [rootId];
  while (stack.length) {
    const current = stack.pop()!;
    if (out.has(current)) continue;
    out.add(current);
    const children = childrenByParent.get(current) ?? [];
    for (const c of children) stack.push(c);
  }
  return out;
}

export default function DashboardMembersBranchGenerationList({
  persons,
}: {
  persons: Person[];
}) {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortKey>("birth_asc");
  const [branchId, setBranchId] = useState<number | "">("");
  const [generation, setGeneration] = useState<number | "">("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Allow deep-linking from branches table:
  // /dashboard?view=members_filter&branch_id=123 (generation omitted => all)
  useEffect(() => {
    const rawBranchId = searchParams.get("branch_id");
    if (rawBranchId != null && rawBranchId !== "") {
      const parsed = Number(rawBranchId);
      if (Number.isFinite(parsed)) setBranchId(parsed);
    }

    const rawGeneration = searchParams.get("generation");
    if (rawGeneration != null && rawGeneration !== "") {
      const parsed = Number(rawGeneration);
      if (Number.isFinite(parsed)) setGeneration(parsed);
    } else {
      // If not provided, treat as "all"
      setGeneration("");
    }

    const rawSort = searchParams.get("sort");
    if (rawSort != null && rawSort !== "") {
      // Validate sort option
      const validSorts: SortKey[] = [
        "birth_asc",
        "birth_desc",
        "name_asc",
        "name_desc",
        "generation_asc",
        "generation_desc",
        "updated_asc",
        "updated_desc",
      ];
      if (validSorts.includes(rawSort as SortKey)) {
        setSortOption(rawSort as SortKey);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    const fetchBranches = async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name, code, parent_id")
        .order("code", { ascending: true, nullsFirst: true });

      if (!isMounted) return;
      setBranches((data ?? []) as BranchRow[]);
      setBranchesLoading(false);
    };
    fetchBranches();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const childrenByParent = useMemo(() => {
    const m = new Map<number, number[]>();
    for (const b of branches) {
      if (b.parent_id == null) continue;
      const arr = m.get(b.parent_id) ?? [];
      arr.push(b.id);
      m.set(b.parent_id, arr);
    }
    return m;
  }, [branches]);

  const branchIdSet = useMemo(() => {
    if (branchId === "" || branches.length === 0) return null;
    return buildDescendantSet(branchId, childrenByParent);
  }, [branchId, branches.length, childrenByParent]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return persons.filter((p) => {
      const matchesSearch =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        (p.other_names ?? "").toLowerCase().includes(q);

      const matchesGeneration =
        generation === "" ? true : p.generation === generation;

      const matchesBranch =
        branchIdSet == null
          ? true
          : !!p.branch_id && branchIdSet.has(p.branch_id);

      return matchesSearch && matchesGeneration && matchesBranch;
    });
  }, [persons, searchTerm, generation, branchIdSet]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.full_name.localeCompare(b.full_name);
        case "name_desc":
          return b.full_name.localeCompare(a.full_name);
        case "birth_desc":
          return (b.birth_year || 0) - (a.birth_year || 0);
        case "generation_asc":
          return (a.generation ?? 999) - (b.generation ?? 999);
        case "generation_desc":
          return (b.generation ?? 999) - (a.generation ?? 999);
        case "updated_asc":
          return (
            new Date(a.updated_at || 0).getTime() -
            new Date(b.updated_at || 0).getTime()
          );
        case "updated_desc":
          return (
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime()
          );
        case "birth_asc":
        default:
          return (a.birth_year || 0) - (b.birth_year || 0);
      }
    });
    return arr;
  }, [filtered, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOption, branchId, generation]);

  return (
    <>
      <div className="mb-8 relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200/60 transition-all duration-300 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row gap-4 w-full flex-1">
            <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
              <input
                type="text"
                placeholder="Tìm kiếm thành viên..."
                className="bg-white/90 text-stone-900 w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200/80 shadow-sm placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full items-center">
              <div className="relative w-full sm:w-72">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                <select
                  className="appearance-none bg-white/90 text-stone-700 w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200/80 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 hover:border-amber-300 font-medium text-sm transition-all focus:bg-white disabled:opacity-60"
                  value={branchId}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBranchId(v === "" ? "" : Number(v));
                  }}
                  disabled={branchesLoading}
                >
                  <option value="">
                    {branchesLoading
                      ? "Đang tải chi..."
                      : "Tất cả chi (gồm chi con)"}
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code ? `${b.code} - ` : ""}
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-44">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                <input
                  type="number"
                  min={1}
                  placeholder="Đời"
                  className="bg-white/90 text-stone-900 w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200/80 shadow-sm placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  value={generation}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGeneration(v === "" ? "" : Number(v));
                  }}
                />
              </div>

              <div className="relative w-full sm:w-56">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
                <select
                  className="appearance-none bg-white/90 text-stone-700 w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200/80 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 hover:border-amber-300 font-medium text-sm transition-all focus:bg-white"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortKey)}
                >
                  <option value="birth_asc">Năm sinh (Tăng dần)</option>
                  <option value="birth_desc">Năm sinh (Giảm dần)</option>
                  <option value="name_asc">Tên (A-Z)</option>
                  <option value="name_desc">Tên (Z-A)</option>
                  <option value="generation_asc">Thế hệ (Tăng dần)</option>
                  <option value="generation_desc">Thế hệ (Giảm dần)</option>
                  <option value="updated_desc">Cập nhật (Mới nhất)</option>
                  <option value="updated_asc">Cập nhật (Cũ nhất)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pageItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-stone-400 italic">
          Không tìm thấy thành viên phù hợp.
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((x) => Math.max(1, x - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-10 h-10 rounded-lg border transition-colors ${
                  currentPage === p
                    ? "bg-amber-500 text-white border-amber-500"
                    : "border-stone-300 hover:bg-stone-50 text-stone-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage((x) => Math.min(totalPages, x + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      )}

      <div className="text-center text-sm text-stone-600 mt-4">
        Hiển thị {pageItems.length} / {sorted.length} thành viên
        {sorted.length > pageSize && ` - Trang ${currentPage}/${totalPages}`}
      </div>
    </>
  );
}
