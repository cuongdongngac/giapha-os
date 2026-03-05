"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  branchId: number | null;
}

export default function BranchName({ branchId }: Props) {
  const [name, setName] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!branchId) {
      setName(null);
      return;
    }

    let isMounted = true;

    const fetchBranch = async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("name")
        .eq("id", branchId)
        .single();

      if (!error && isMounted) {
        setName(data?.name ?? null);
      }
    };

    fetchBranch();

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  return <span className="text-sm text-inherit">{name ?? "No Branch"}</span>;
}
