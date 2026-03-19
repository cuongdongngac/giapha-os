"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";

export interface MembersBranchOption {
  id: number;
  name: string;
  code?: string | null;
}

function toIntOrNull(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MembersBranchGenerationFilterBar({
  branches,
}: {
  branches: MembersBranchOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentQ = searchParams.get("q") ?? "";
  const currentBranchId = toIntOrNull(searchParams.get("branch_id"));
  const currentGeneration = toIntOrNull(searchParams.get("generation"));
  const currentSort = searchParams.get("sort") ?? "birth_asc";

  const [q, setQ] = useState(currentQ);

  // Force re-render when URL params change
  const [, forceUpdate] = useState({});
  useEffect(() => {
    setQ(currentQ);
    forceUpdate({});
  }, [currentQ, currentBranchId, currentGeneration, currentSort]);

  const generationOptions = useMemo(() => {
    // Keep simple + predictable. If you want dynamic max, we can query distinct generations.
    return Array.from({ length: 30 }, (_, i) => i + 1);
  }, []);

  const pushParams = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    // Any filter change resets paging
    sp.delete("page");
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === "") sp.delete(k);
      else sp.set(k, v);
    });
    console.log("pushParams called with:", next);
    console.log("Final URL params:", sp.toString());
    const newUrl = `${pathname}?${sp.toString()}`;
    router.push(newUrl);

    // Force refresh to ensure server re-renders with new params
    setTimeout(() => {
      if (window.location.href !== newUrl) {
        window.location.href = newUrl;
      }
    }, 100);
  };

  return (
    <div key={currentSort} className="mb-6">
      <div className="flex flex-col lg:flex-row gap-3 bg-white/60 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-stone-200/60">
        <div className="relative flex-1 max-w-xl group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm theo tên..."
            className="bg-white/90 text-stone-900 w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200/80 shadow-sm placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") pushParams({ q: q.trim() || null });
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <select
              className="appearance-none bg-white/90 text-stone-700 w-full sm:w-72 pl-9 pr-8 py-2.5 rounded-xl border border-stone-200/80 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 hover:border-amber-300 font-medium text-sm transition-all focus:bg-white"
              value={currentBranchId ?? ""}
              onChange={(e) =>
                pushParams({
                  branch_id: e.target.value
                    ? String(Number(e.target.value))
                    : null,
                })
              }
            >
              <option value="">Tất cả chi</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code ? `${b.code} - ` : ""}
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <select
              className="appearance-none bg-white/90 text-stone-700 w-full sm:w-44 pl-9 pr-8 py-2.5 rounded-xl border border-stone-200/80 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 hover:border-amber-300 font-medium text-sm transition-all focus:bg-white"
              value={currentGeneration ?? ""}
              onChange={(e) =>
                pushParams({
                  generation: e.target.value
                    ? String(Number(e.target.value))
                    : null,
                })
              }
            >
              <option value="">Tất cả đời</option>
              {generationOptions.map((g) => (
                <option key={g} value={g}>
                  Đời {g}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <select
              key={currentSort} // Force re-render when sort changes
              className="appearance-none bg-white/90 text-stone-700 w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-stone-200/80 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 hover:border-amber-300 font-medium text-sm transition-all focus:bg-white"
              value={currentSort}
              onChange={(e) => pushParams({ sort: e.target.value })}
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

          <button
            onClick={() => pushParams({ q: q.trim() || null })}
            className="btn-primary whitespace-nowrap"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}
