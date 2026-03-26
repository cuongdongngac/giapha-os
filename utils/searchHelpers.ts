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
