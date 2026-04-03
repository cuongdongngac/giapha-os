"use server";

import { Relationship, RelationshipType } from "@/types";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Payload shape cho file backup JSON.
 * Các field DB-managed (created_at, updated_at) được giữ để tham khảo
 * nhưng sẽ bị loại bỏ khi import lại.
 */
interface PersonExport {
  id: string;
  full_name: string;
  gender: "male" | "female" | "other";
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  is_deceased: boolean;
  is_in_law: boolean;
  birth_order: number | null;
  generation: number | null;
  other_names: string | null;
  avatar_url: string | null;
  note: string | null;
  // DB-managed fields (kept in export for traceability, stripped on import)
  created_at?: string;
  updated_at?: string;
}

interface RelationshipExport {
  id?: string;
  type: RelationshipType;
  person_a: string;
  person_b: string;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PersonDetailsPrivateExport {
  person_id: string;
  phone_number: string | null;
  occupation: string | null;
  current_residence: string | null;
}

interface CustomEventExport {
  id: string;
  name: string;
  content: string | null;
  event_date: string;
  location: string | null;
  created_by: string | null;
}

interface BackupPayload {
  version: number;
  timestamp: string;
  persons: PersonExport[];
  relationships: RelationshipExport[];
  person_details_private?: PersonDetailsPrivateExport[];
  custom_events?: CustomEventExport[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function verifyAdmin() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vui lòng đăng nhập." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin")
    return { error: "Từ chối truy cập. Chỉ admin mới có quyền này." };

  return supabase;
}

// Các field được phép insert vào bảng persons (loại bỏ created_at/updated_at)
function sanitizePerson(
  p: PersonExport,
): Omit<PersonExport, "created_at" | "updated_at"> {
  return {
    id: p.id,
    full_name: p.full_name,
    gender: p.gender,
    birth_year: p.birth_year ?? null,
    birth_month: p.birth_month ?? null,
    birth_day: p.birth_day ?? null,
    death_year: p.death_year ?? null,
    death_month: p.death_month ?? null,
    death_day: p.death_day ?? null,
    is_deceased: p.is_deceased ?? false,
    is_in_law: p.is_in_law ?? false,
    birth_order: p.birth_order ?? null,
    generation: p.generation ?? null,
    other_names: p.other_names ?? null,
    avatar_url: p.avatar_url ?? null,
    note: p.note ?? null,
  };
}

function sanitizeRelationship(
  r: RelationshipExport,
): Omit<RelationshipExport, "id" | "created_at" | "updated_at"> {
  return {
    type: r.type,
    person_a: r.person_a,
    person_b: r.person_b,
    note: r.note ?? null,
  };
}

function sanitizeCustomEvent(
  e: CustomEventExport,
): Omit<CustomEventExport, "created_by"> {
  return {
    id: e.id,
    name: e.name,
    content: e.content ?? null,
    event_date: e.event_date,
    location: e.location ?? null,
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportData(
  exportRootId?: string,
): Promise<BackupPayload | { error: string }> {
  const supabaseResult = await verifyAdmin();
  if ("error" in supabaseResult) return supabaseResult;
  const supabase = supabaseResult;

  // Helper to fetch all records bypassing the 1000 limit
  async function fetchAll(table: string, columns: string, orderColumn: string) {
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .order(orderColumn, { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
      } else {
        break;
      }
      page++;
    }
    return allData;
  }

  let allPersons: PersonExport[] = [];
  let allRels: RelationshipExport[] = [];
  let allPrivateDetails: PersonDetailsPrivateExport[] = [];
  let allCustomEvents: CustomEventExport[] = [];

  try {
    const personsData = await fetchAll(
      "persons", 
      "id, full_name, gender, birth_year, birth_month, birth_day, death_year, death_month, death_day, is_deceased, is_in_law, birth_order, generation, other_names, avatar_url, note, created_at, updated_at", 
      "created_at"
    );
    allPersons = personsData as PersonExport[];

    const relsData = await fetchAll(
      "relationships", 
      "id, type, person_a, person_b, note, created_at, updated_at", 
      "created_at"
    );
    allRels = relsData as RelationshipExport[];

    const privateData = await fetchAll(
      "person_details_private",
      "person_id, phone_number, occupation, current_residence",
      "person_id"
    );
    allPrivateDetails = privateData as PersonDetailsPrivateExport[];

    const eventsData = await fetchAll(
      "custom_events",
      "id, name, content, event_date, location, created_by",
      "event_date"
    );
    allCustomEvents = eventsData as CustomEventExport[];

  } catch (error: any) {
    return { error: "Lỗi tải dữ liệu: " + error.message };
  }

  let exportPersons = allPersons;
  let exportRels = allRels;
  let exportPrivateDetails = allPrivateDetails;
  const exportCustomEvents = allCustomEvents;

  // If a root person is selected, filter the export to only their subtree
  if (exportRootId && exportPersons.some((p) => p.id === exportRootId)) {
    const includedPersonIds = new Set<string>([exportRootId]);

    // 1. Traverse biological and adopted children recursively
    const findDescendants = (parentId: string) => {
      exportRels
        .filter(
          (r) =>
            (r.type === "biological_child" || r.type === "adopted_child") &&
            r.person_a === parentId,
        )
        .forEach((r) => {
          if (!includedPersonIds.has(r.person_b)) {
            includedPersonIds.add(r.person_b);
            findDescendants(r.person_b);
          }
        });
    };
    findDescendants(exportRootId);

    // 2. Add spouses for everyone in the tree so far
    const descendantsArray = Array.from(includedPersonIds); // snapshot current members
    descendantsArray.forEach((personId) => {
      exportRels
        .filter(
          (r) =>
            r.type === "marriage" &&
            (r.person_a === personId || r.person_b === personId),
        )
        .forEach((r) => {
          const spouseId = r.person_a === personId ? r.person_b : r.person_a;
          includedPersonIds.add(spouseId);
        });
    });

    // 3. Filter the payload
    exportPersons = allPersons.filter((p) => includedPersonIds.has(p.id));
    exportRels = allRels.filter(
      (r) =>
        includedPersonIds.has(r.person_a) && includedPersonIds.has(r.person_b),
    );
    exportPrivateDetails = allPrivateDetails.filter((d) =>
      includedPersonIds.has(d.person_id),
    );
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    persons: exportPersons,
    relationships: exportRels,
    person_details_private: exportPrivateDetails,
    custom_events: exportCustomEvents,
  };
}

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importData(
  importPayload:
    | BackupPayload
    | {
        persons: PersonExport[];
        relationships: Relationship[];
        person_details_private?: PersonDetailsPrivateExport[];
        custom_events?: CustomEventExport[];
      },
) {
  const supabaseResult = await verifyAdmin();
  if ("error" in supabaseResult) return supabaseResult;
  const supabase = supabaseResult;

  if (!importPayload?.persons || !importPayload?.relationships) {
    return { error: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại file JSON." };
  }

  if (importPayload.persons.length === 0) {
    return {
      error: "File backup trống — không có thành viên nào để phục hồi.",
    };
  }

  // 1. Xoá custom_events
  const { error: delEventsError } = await supabase
    .from("custom_events")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delEventsError)
    return {
      error: "Lỗi khi xoá custom_events cũ: " + delEventsError.message,
    };

  // 2. Xoá relationships (FK constraint)
  const { error: delRelError } = await supabase
    .from("relationships")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delRelError)
    return { error: "Lỗi khi xoá relationships cũ: " + delRelError.message };

  // 3. Xoá person_details_private (FK constraint on persons)
  const { error: delPrivateError } = await supabase
    .from("person_details_private")
    .delete()
    .neq("person_id", "00000000-0000-0000-0000-000000000000");

  if (delPrivateError)
    return {
      error:
        "Lỗi khi xoá person_details_private cũ: " + delPrivateError.message,
    };

  // 4. Xoá persons
  const { error: delPersonsError } = await supabase
    .from("persons")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delPersonsError)
    return { error: "Lỗi khi xoá persons cũ: " + delPersonsError.message };

  // 5. Insert persons (sanitized — chỉ giữ các field schema hiện tại)
  const CHUNK = 200;
  const persons = importPayload.persons.map(sanitizePerson);

  for (let i = 0; i < persons.length; i += CHUNK) {
    const chunk = persons.slice(i, i + CHUNK);
    const { error } = await supabase.from("persons").insert(chunk);
    if (error)
      return {
        error: `Lỗi khi import persons (chunk ${i / CHUNK + 1}): ${error.message}`,
      };
  }

  // 6. Insert relationships (stripped of id/created_at to avoid conflicts)
  // Filter out self-relationships to avoid "no_self_relationship" constraint violation
  const relationships = importPayload.relationships
    .filter((r) => r.person_a !== r.person_b)
    .map(sanitizeRelationship);

  for (let i = 0; i < relationships.length; i += CHUNK) {
    const chunk = relationships.slice(i, i + CHUNK);
    const { error } = await supabase.from("relationships").insert(chunk);
    if (error)
      return {
        error: `Lỗi khi import relationships (chunk ${i / CHUNK + 1}): ${error.message}`,
      };
  }

  // 7. Insert person_details_private (if present in payload)
  let privateDetailsCount = 0;
  const privateDetails = importPayload.person_details_private ?? [];
  if (privateDetails.length > 0) {
    for (let i = 0; i < privateDetails.length; i += CHUNK) {
      const chunk = privateDetails.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("person_details_private")
        .insert(chunk);
      if (error)
        return {
          error: `Lỗi khi import person_details_private (chunk ${i / CHUNK + 1}): ${error.message}`,
        };
    }
    privateDetailsCount = privateDetails.length;
  }

  // 8. Insert custom_events (if present in payload, strip created_by)
  let customEventsCount = 0;
  const customEvents = (importPayload.custom_events ?? []).map(
    sanitizeCustomEvent,
  );
  if (customEvents.length > 0) {
    for (let i = 0; i < customEvents.length; i += CHUNK) {
      const chunk = customEvents.slice(i, i + CHUNK);
      const { error } = await supabase.from("custom_events").insert(chunk);
      if (error)
        return {
          error: `Lỗi khi import custom_events (chunk ${i / CHUNK + 1}): ${error.message}`,
        };
    }
    customEventsCount = customEvents.length;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/data");

  return {
    success: true,
    imported: {
      persons: persons.length,
      relationships: relationships.length,
      person_details_private: privateDetailsCount,
      custom_events: customEventsCount,
    },
  };
}
