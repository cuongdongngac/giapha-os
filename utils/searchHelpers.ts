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
 * Checks whether a person's name fields match a search query using word-start matching.
 * Each word in the query must match the beginning of at least one word in
 * the combined full_name + other_names string. This is narrower than a plain
 * substring search (e.g. "an" will NOT match "Thanh" but WILL match "An Bình").
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

  // Tokenize the combined name into words
  const nameStr = normalizeVietnamese(
    `${fullName} ${otherNames ?? ""}`,
  );
  const nameWords = nameStr.split(/\s+/).filter(Boolean);

  // Every query word must be a prefix of at least one name word
  const queryWords = q.split(/\s+/).filter(Boolean);
  return queryWords.every((qw) =>
    nameWords.some((nw) => nw.startsWith(qw)),
  );
}
