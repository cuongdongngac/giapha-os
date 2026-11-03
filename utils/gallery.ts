import type { SupabaseClient } from "@supabase/supabase-js";

export const GALLERY_BUCKET = "gallery";
export const GALLERY_MAX_INPUT_BYTES = 25 * 1024 * 1024; // ảnh gốc tối đa 25MB (sẽ được nén lại)
const MAX_DIMENSION = 2000; // cạnh dài nhất sau khi nén
const JPEG_QUALITY = 0.85;

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
  ext: string;
  contentType: string;
}

/**
 * Thu nhỏ & nén ảnh ngay trên trình duyệt trước khi tải lên.
 * Ảnh điện thoại 5–10MB thường còn ~400–800KB, tải nhanh hơn và tiết kiệm dung lượng Supabase.
 * GIF giữ nguyên (để không mất ảnh động).
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.type === "image/gif") {
    const dims = await readDimensions(file).catch(() => ({ width: 0, height: 0 }));
    return { blob: file, ...dims, ext: "gif", contentType: "image/gif" };
  }

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  // Nền trắng để ảnh PNG trong suốt không bị đen khi chuyển sang JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("Không nén được ảnh.");

  // Nếu ảnh gốc đã nhỏ hơn bản nén (ảnh đã tối ưu sẵn) thì giữ ảnh gốc
  if (scale === 1 && file.size <= blob.size && file.type === "image/jpeg") {
    return { blob: file, width, height, ext: "jpg", contentType: "image/jpeg" };
  }
  return { blob, width, height, ext: "jpg", contentType: "image/jpeg" };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // imageOrientation: tôn trọng hướng xoay EXIF của ảnh chụp điện thoại
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* rơi xuống cách dự phòng */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Không đọc được ảnh "${file.name}".`));
    };
    img.src = url;
  });
}

async function readDimensions(file: File) {
  const bmp = await loadBitmap(file);
  const dims = { width: bmp.width, height: bmp.height };
  if ("close" in bmp && typeof bmp.close === "function") bmp.close();
  return dims;
}

/** Tải ảnh đã chuẩn bị lên bucket 'gallery'. Trả về URL công khai và đường dẫn file. */
export async function uploadGalleryImage(
  supabase: SupabaseClient,
  image: PreparedImage,
): Promise<{ url: string; path: string }> {
  const now = new Date();
  const folder = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${folder}/${id}.${image.ext}`;

  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, image.blob, {
    contentType: image.contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error("Lỗi khi tải ảnh lên: " + error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path);
  return { url: publicUrl, path };
}

/** Lấy đường dẫn file trong bucket từ bản ghi (ưu tiên storage_path, dự phòng tách từ URL). */
export function galleryPathFromItem(item: { storage_path: string | null; image_url: string }) {
  if (item.storage_path) return item.storage_path;
  const marker = `/storage/v1/object/public/${GALLERY_BUCKET}/`;
  const i = item.image_url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(item.image_url.slice(i + marker.length)) : null;
}

export async function removeGalleryFile(supabase: SupabaseClient, path: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([path]);
  if (error) console.warn("Không xoá được file ảnh:", error.message);
}

/** "2026-03-08" -> "08/03/2026" (không lệch múi giờ) */
export function formatGalleryDate(date: string | null | undefined) {
  if (!date) return "";
  const [y, m, d] = date.slice(0, 10).split("-");
  return d && m && y ? `${d}/${m}/${y}` : date;
}

export function fileNameToTitle(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}
