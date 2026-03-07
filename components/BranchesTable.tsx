"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export interface BranchRow {
  id: number;
  name: string;
  code: string | null;
  parent_id: number | null;
  description: string | null;
  created_at: string | null;
  founder: string | null;
  church: string | null;
}

export default function BranchesTable() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name, code, parent_id, description, created_at, founder, church")
        .order("code", { ascending: true, nullsFirst: true });

      if (!error && data) {
        setBranches(data as BranchRow[]);
      }
      setLoading(false);
    };

    fetchBranches();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-stone-200/60 p-8 text-center text-stone-500">
        Đang tải danh sách chi họ...
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="uppercase tracking-wider border-b border-stone-200/60 bg-stone-50/50">
            <tr>
              <th className="px-6 py-4 text-stone-500 font-semibold text-xs">
                Mã chi
              </th>
              <th className="px-6 py-4 text-stone-500 font-semibold text-xs">
                Tên chi họ
              </th>
              <th className="px-6 py-4 text-stone-500 font-semibold text-xs">
                Người sáng lập
              </th>
              <th className="px-6 py-4 text-stone-500 font-semibold text-xs">
                Nhà thờ họ
              </th>
              <th className="px-6 py-4 text-stone-500 font-semibold text-xs">
                Mô tả
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {branches.map((branch) => (
              <tr
                key={branch.id}
                className="hover:bg-stone-50/80 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-stone-900">
                  {branch.code ?? "—"}
                </td>
                <td className="px-6 py-4 text-stone-800">{branch.name}</td>
                <td className="px-6 py-4 text-stone-600">
                  {branch.founder ?? "—"}
                </td>
                <td className="px-6 py-4 text-stone-600">
                  {branch.church ?? "—"}
                </td>
                <td className="px-6 py-4 text-stone-600 max-w-xs truncate">
                  {branch.description ?? "—"}
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-stone-500"
                >
                  Chưa có dữ liệu chi họ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
