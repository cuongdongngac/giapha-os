/**
 * Normalizes a Vietnamese string by removing accents and converting to lowercase.
 * This is useful for search functionality to be accent-insensitive.
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

/**
 * Checks whether a person's name fields match a search query.
 * Uses AND logic across query words: every word in the query must appear
 * as a substring somewhere in the combined full_name + other_names.
 *
 * This is narrower than the old single-term search (which used %fullQuery%
 * as one chunk), because with multi-word queries ALL words must be present,
 * regardless of their order in the name.
 *
 * @param query      The raw search string typed by the user.
 * @param fullName   The person's full_name field.
 * @param otherNames The person's other_names field (may be null/undefined).
 */
export function personMatchesSearch(
  query: string,
  fullName: string,
  otherNames: string | null | undefined,
): boolean {
  const q = normalizeVietnamese(query.trim());
  if (!q) return true; // empty query → show all

  // Normalize the combined name once
  const nameStr = normalizeVietnamese(`${fullName} ${otherNames ?? ""}`);

  // Every query word must appear somewhere in the combined name (AND logic)
  const queryWords = q.split(/\s+/).filter(Boolean);
  return queryWords.every((qw) => nameStr.includes(qw));
}
