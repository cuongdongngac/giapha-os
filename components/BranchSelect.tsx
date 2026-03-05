"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { BranchOption } from "@/types/index";

interface BranchSelectProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function BranchSelect({ value, onChange }: BranchSelectProps) {
  const [options, setOptions] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name")
        .order("id");

      setOptions(data ?? []);
      setLoading(false);
    };

    fetchBranches();
  }, []);

  return (
    <div className="w-full">
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        disabled={loading}
        className="
      w-full
      appearance-none
      border
      border-stone-300
      bg-white
      text-sm
      rounded-md
      px-3
      py-1.5
      text-stone-700
      focus:outline-none
      focus:border-stone-500
      focus:ring-1
      focus:ring-stone-400
      disabled:bg-stone-100
      disabled:text-stone-400
      transition
    "
      >
        <option value="">{loading ? "Đang tải..." : "-- Chọn --"}</option>

        {options.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}
