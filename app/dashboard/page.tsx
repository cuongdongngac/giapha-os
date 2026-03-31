import { DashboardProvider } from "@/components/DashboardContext";
import DashboardViews from "@/components/DashboardViews";
import MemberDetailModal from "@/components/MemberDetailModal";
import ViewToggle from "@/components/ViewToggle";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Person, Relationship } from "@/types";
import { Post } from "@/app/actions/posts";

interface PageProps {
  searchParams: Promise<{ view?: string; rootId?: string }>;
}

export default async function FamilyTreePage({ searchParams }: PageProps) {
  const { view = "list", rootId: queryRootId } = await searchParams;

  // Get rootId from environment variable
  const envRootId = process.env.NEXT_PUBLIC_ROOTID;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    : { data: null };

  const canEdit = profile?.role === "admin" || profile?.role === "editor";

  // Only load persons and relationships if NOT viewing posts
  // This is the key optimization - avoid loading huge datasets when not needed
  let persons: Person[] = [];
  let relationships: Relationship[] = [];
  let finalRootId = queryRootId || envRootId;

  // Load posts server-side when viewing posts (same pattern as persons)
  let initialPosts: Post[] = [];
  let initialPostsCount = 0;

  if (view === "posts") {
    console.log("Loading posts server-side for posts view");
    const status = canEdit ? "all" : "published";

    let query = supabase
      .from("posts")
      .select(
        "id, title, slug, excerpt, featured_image, author_id, status, published_at, created_at, updated_at",
        { count: "estimated" },
      );

    if (status !== "all") {
      query = query
        .eq("status", status)
        .order("published_at", { ascending: false, nullsFirst: false });
    } else {
      query = query
        .order("status", { ascending: false })
        .order("updated_at", { ascending: false, nullsFirst: false });
    }

    const { data, count } = await query.range(0, 9);
    initialPosts = (data as Post[]) || [];
    initialPostsCount = count || 0;
  } else {
    console.log("Loading persons and relationships for view:", view);

    // For list view, implement pagination
    const pageSize = 50; // 50 members per page
    const page = 1; // Get from search params later

    let personsData: any[] = [];
    let relsData: any[] = [];

    // Recursive fetch function to ensure we get ALL records regardless of server limits
    async function fetchEverything(table: string) {
      let allData: any[] = [];
      let from = 0;
      let to = 999;
      const step = 1000;

      console.log(`Starting fetch for ${table}...`);

      while (true) {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .range(from, to);

        if (error) {
          console.error(
            `Error fetching ${table} at range ${from}-${to}:`,
            error,
          );
          break;
        }

        if (!data || data.length === 0) break;

        allData = [...allData, ...data];
        console.log(
          `Fetched ${data.length} records from ${table}. Total: ${allData.length}`,
        );

        if (data.length < step) break; // Last page

        from += step;
        to += step;
      }
      return allData;
    }

    personsData = await fetchEverything("persons");
    relsData = await fetchEverything("relationships");

    relationships = relsData;
    persons = personsData as Person[];

    // Prepare map and roots for tree views
    const personsMap = new Map();
    persons.forEach((p) => personsMap.set(p.id, p));

    const childIds = new Set(
      relationships
        .filter(
          (r) => r.type === "biological_child" || r.type === "adopted_child",
        )
        .map((r) => r.person_b),
    );

    // If no rootId is provided, fallback to the earliest created person
    if (!finalRootId || !personsMap.has(finalRootId)) {
      const rootsFallback = persons.filter((p) => !childIds.has(p.id));
      if (rootsFallback.length > 0) {
        finalRootId = rootsFallback[0].id;
      } else if (persons.length > 0) {
        finalRootId = persons[0].id; // ultimate fallback
      }
    }
  }

  return (
    <DashboardProvider initialRootId={finalRootId}>
      <div className="sticky top-0 z-50 bg-[#fafaf9]/80 backdrop-blur-md border-b border-stone-200/60 pb-2">
        <ViewToggle />
      </div>

      <div className="flex-1 overflow-auto">
        <DashboardViews
          persons={persons}
          relationships={relationships}
          canEdit={canEdit}
          finalRootId={finalRootId}
          initialPosts={initialPosts}
          initialPostsCount={initialPostsCount}
        />
      </div>

      <MemberDetailModal />
    </DashboardProvider>
  );
}
