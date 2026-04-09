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
 * Checks if a string contains any Vietnamese diacritics (accents).
 */
export function hasVietnameseAccents(str: string): boolean {
  if (!str) return false;
  const normalized = str.normalize("NFD");
  // Check for presence of combining marks (accents) or the specific 'đ' character
  return /[\u0300-\u036f]/.test(normalized) || /[đĐ]/.test(str);
}

/**
 * Checks whether a person's name fields match a search query.
 * Implements smarter Vietnamese search:
 * 1. AND logic: all query words must match.
 * 2. Word-start matching: query words should match the beginning of words in the name.
 * 3. Accent awareness: if query has accents, match strictly. If no accents, match loosely.
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
  const rawQuery = query.trim().toLowerCase();
  if (!rawQuery) return true;

  const queryWords = rawQuery.split(/\s+/).filter(Boolean);
  const nameParts = `${fullName} ${otherNames ?? ""}`.toLowerCase();
  const normalizedNameParts = normalizeVietnamese(nameParts);

  // For each word in the query, it must match at least one word start in the name
  return queryWords.every((qw) => {
    const normalizedQw = normalizeVietnamese(qw);
    const hasAccents = hasVietnameseAccents(qw);

    if (hasAccents) {
      // Strict match: the accented query word must match the beginning of some word in the name
      // We use a regex to find the word start. \b matches word boundaries.
      // However, \b doesn't work perfectly with Unicode. A better way:
      const wordsInName = nameParts.split(/\s+/).filter(Boolean);
      return wordsInName.some((nw) => qw === nw || nw.startsWith(qw));
    } else {
      // Loose match: the unaccented query word must match the beginning of some normalized word in the name
      const normalizedWordsInName = normalizedNameParts.split(/\s+/).filter(Boolean);
      return normalizedWordsInName.some((nw) => normalizedQw === nw || nw.startsWith(normalizedQw));
    }
  });
}
