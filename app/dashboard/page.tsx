import { DashboardProvider } from "@/components/DashboardContext";
import DashboardViews from "@/components/DashboardViews";
import MemberDetailModal from "@/components/MemberDetailModal";
import ViewToggle from "@/components/ViewToggle";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ view?: string; rootId?: string }>;
}

export default async function FamilyTreePage({ searchParams }: PageProps) {
  const { view = "list" } = await searchParams;

  // Get rootId from environment variable
  const envRootId = process.env.NEXT_PUBLIC_ROOTID;

  // If view is list, we only need persons, not relationships.
  // We fetch persons for all views to pass down as a prop if we want, or let components fetch.
  // For list view, we implement pagination to avoid loading too many members
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

  const canEdit = profile?.role === "admin" || profile?.role === "editor";

  // For list view, implement pagination
  const pageSize = 50; // 50 members per page
  const page = 1; // Get from search params later

  let personsData = [];
  let relationships = [];

  // Always fetch all persons for search/filter to work properly
  // We optimize by only selecting necessary fields to draw the tree/list
  const { data: allPersons } = await supabase
    .from("persons")
    .select("id, full_name, gender, birth_year, birth_month, birth_day, death_year, death_month, death_day, avatar_url, note, created_at, updated_at, is_deceased, is_in_law, is_notable, birth_order, generation, branch_id, other_names")
    .order("birth_year", { ascending: true, nullsFirst: false });

  const { data: relsData } = await supabase
    .from("relationships")
    .select("id, type, person_a, person_b, note, created_at, updated_at");

  personsData = allPersons || [];
  relationships = relsData || [];

  const persons = personsData;

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

  let finalRootId = envRootId;

  // If no rootId is provided, fallback to the earliest created person
  if (!finalRootId || !personsMap.has(finalRootId)) {
    const rootsFallback = persons.filter((p) => !childIds.has(p.id));
    if (rootsFallback.length > 0) {
      finalRootId = rootsFallback[0].id;
    } else if (persons.length > 0) {
      finalRootId = persons[0].id; // ultimate fallback
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
        />
      </div>

      <MemberDetailModal />
    </DashboardProvider>
  );
}
