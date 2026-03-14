"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Props {
  branchId: number | null;
}

// Module-level cache to share across all instances of BranchName
let branchesCache: Record<number, string> | null = null;
let fetchPromise: Promise<Record<number, string>> | null = null;

export default function BranchName({ branchId }: Props) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) {
      setName(null);
      return;
    }

    let isMounted = true;

    const getBranchName = async () => {
      // 1. If we already have the data locally, use it immediately
      if (branchesCache) {
        if (isMounted) setName(branchesCache[branchId] ?? null);
        return;
      }

      // 2. If no one is fetching yet, start the fetch for ALL branches
      if (!fetchPromise) {
        fetchPromise = (async () => {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("branches")
            .select("id, name");
          
          const map: Record<number, string> = {};
          if (!error && data) {
            data.forEach((b) => {
              map[b.id] = b.name;
            });
            branchesCache = map; // Save for subsequent renders
          }
          return map;
        })();
      }

      // 3. Wait for the fetch (whether started by this component or another)
      const map = await fetchPromise;
      if (isMounted && map) {
        setName(map[branchId] ?? null);
      }
    };

    getBranchName();

    return () => {
      isMounted = false;
    };
  }, [branchId]);

  return <span className="text-sm text-inherit">{name ?? "No Branch"}</span>;
}
