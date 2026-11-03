"use client";

import { logAction } from "@/app/actions/simple-logging";
import { BranchOption, GalleryItem } from "@/types";
import {
  GALLERY_MAX_INPUT_BYTES,
  fileNameToTitle,
  galleryPathFromItem,
  prepareImage,
  removeGalleryFile,
  uploadGalleryImage,
} from "@/utils/gallery";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData: GalleryItem | null;
  branches: BranchOption[];
  personMap: Map<string, string>;
  existingAlbums: string[];
  currentUserId: string | null;
}

interface PickedFile {
  file: File;
  preview: string;
}

const inputCls =
  "block w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 shadow-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

export default function GalleryUploadModal({
  isOpen,
  onClose,
  onSaved,
  initialData,
  branches,
  personMap,
  existingAlbums,
  currentUserId,
}: Props) {
  const isEdit = !!initialData;
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [album, setAlbum] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [branchId, setBranchId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [people, setPeople] = useState<{ id: string; full_name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Nạp dữ liệu khi mở
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setProgress("");
    filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setAlbum(initialData.album ?? "");
      setEventDate(initialData.event_date ?? "");
      setBranchId(initialData.branch_id);
      setIsPublic(initialData.is_public);
      setPeople(
        (initialData.person_ids ?? []).map((id) => ({ id, full_name: personMap.get(id) ?? "(không rõ)" })),
      );
    } else {
      setTitle("");
      setDescription("");
      setAlbum("");
      setEventDate("");
      setBranchId(null);
      setIsPublic(true);
      setPeople([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  // Giải phóng ảnh xem trước khi đóng modal
  const filesRef = useRef<PickedFile[]>([]);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview)), []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const addFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const picked: PickedFile[] = [];
    const rejected: string[] = [];
    Array.from(list).forEach((f) => {
      if (!f.type.startsWith("image/")) rejected.push(`${f.name} (không phải ảnh)`);
      else if (f.size > GALLERY_MAX_INPUT_BYTES) rejected.push(`${f.name} (quá 25MB)`);
      else picked.push({ file: f, preview: URL.createObjectURL(f) });
    });
    setError(rejected.length ? `Bỏ qua: ${rejected.join(", ")}` : null);
    setFiles((prev) => (isEdit ? picked.slice(0, 1) : [...prev, ...picked]));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx]?.preview ?? "");
      return prev.filter((_, i) => i !== idx);
    });

  const multi = !isEdit && files.length > 1;
  const canSubmit = !busy && (isEdit ? !!title.trim() : files.length > 0 && (multi || !!title.trim()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const common = {
      description: description.trim() || null,
      album: album.trim() || null,
      event_date: eventDate || null,
      branch_id: branchId,
      person_ids: people.map((p) => p.id),
      is_public: isPublic,
    };

    try {
      if (isEdit && initialData) {
        let imagePatch = {};
        if (files[0]) {
          setProgress("Đang nén và tải ảnh mới…");
          const img = await prepareImage(files[0].file);
          const { url, path } = await uploadGalleryImage(supabase, img);
          imagePatch = { image_url: url, storage_path: path, width: img.width, height: img.height };
        }
        const { error: dbErr } = await supabase
          .from("gallery_items")
          .update({ ...common, title: title.trim(), ...imagePatch })
          .eq("id", initialData.id);
        if (dbErr) throw dbErr;
        if (files[0]) await removeGalleryFile(supabase, galleryPathFromItem(initialData));
        if (currentUserId) logAction(currentUserId, "update", "gallery", initialData.id, title.trim());
      } else {
        const failed: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const { file } = files[i];
          setProgress(files.length > 1 ? `Đang tải ảnh ${i + 1}/${files.length}…` : "Đang nén và tải ảnh…");
          try {
            const img = await prepareImage(file);
            const { url, path } = await uploadGalleryImage(supabase, img);
            const itemTitle = multi
              ? title.trim()
                ? `${title.trim()} (${i + 1})`
                : fileNameToTitle(file.name) || album.trim() || "Ảnh dòng họ"
              : title.trim();
            const { data, error: dbErr } = await supabase
              .from("gallery_items")
              .insert({
                ...common,
                title: itemTitle,
                image_url: url,
                storage_path: path,
                width: img.width,
                height: img.height,
                created_by: currentUserId,
              })
              .select("id")
              .single();
            if (dbErr) {
              await removeGalleryFile(supabase, path);
              throw dbErr;
            }
            if (currentUserId && data) logAction(currentUserId, "create", "gallery", data.id, itemTitle);
          } catch (err) {
            failed.push(`${file.name}: ${err instanceof Error ? err.message : "lỗi"}`);
          }
        }
        if (failed.length) {
          // Giữ lại những ảnh lỗi để người dùng thử lại
          setFiles((prev) => prev.filter((f) => failed.some((m) => m.startsWith(f.file.name + ":"))));
          throw new Error(`Có ${failed.length} ảnh chưa lưu được:\n${failed.join("\n")}`);
        }
      }
      onSaved();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Đã xảy ra lỗi.";
      setError(msg);
    } finally {
      setBusy(false);
      setProgress("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-3 sm:p-6 bg-stone-900/40 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={busy ? undefined : onClose} />
          <motion.div
            initial={{ scale: 0.96, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-stone-100">
              <h2 className="text-lg font-serif font-bold text-stone-800">
                {isEdit ? "Sửa thông tin ảnh" : "Thêm ảnh vào thư viện"}
              </h2>
              <button
                onClick={onClose}
                disabled={busy}
                className="p-2 rounded-full text-stone-500 hover:bg-stone-100 disabled:opacity-40"
                aria-label="Đóng"
              >
                <X className="size-5" />
              </button>
            </div>

            <form id="gallery-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
              {/* Chọn ảnh */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                className="rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-400 bg-stone-50/60 p-4 text-center"
              >
                {files.length === 0 && isEdit && initialData ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={initialData.image_url} alt="" className="max-h-56 mx-auto rounded-lg object-contain" />
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn text-sm">
                      Thay ảnh khác
                    </button>
                  </div>
                ) : files.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 py-6"
                  >
                    <span className="p-4 bg-amber-50 rounded-full text-amber-600">
                      <UploadCloud className="size-8" />
                    </span>
                    <span className="text-sm font-medium text-stone-700">Bấm để chọn ảnh, hoặc kéo thả ảnh vào đây</span>
                    <span className="text-xs text-stone-500">
                      Chọn được nhiều ảnh một lúc. Ảnh lớn sẽ được tự động thu nhỏ.
                    </span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {files.map((f, i) => (
                        <div key={f.preview} className="relative aspect-square rounded-lg overflow-hidden bg-stone-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={f.preview} alt="" className="w-full h-full object-cover" />
                          {!busy && (
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-stone-700 hover:text-red-600 shadow"
                              aria-label="Bỏ ảnh này"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!isEdit && !busy && (
                      <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-amber-700 hover:underline">
                        + Chọn thêm ảnh
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple={!isEdit}
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100 whitespace-pre-line">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Tiêu đề {!multi && <span className="text-red-500">*</span>}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                  placeholder="Ví dụ: Lễ giỗ Tổ năm 2026"
                />
                {multi && (
                  <p className="text-xs text-stone-500 mt-1">
                    Đang chọn {files.length} ảnh: nếu nhập tiêu đề, các ảnh sẽ được đánh số (1), (2)…; bỏ trống thì
                    dùng tên file.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Album</label>
                  <input
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
                    list="gallery-albums"
                    className={inputCls}
                    placeholder="Ví dụ: Giỗ Tổ, Nhà thờ họ…"
                  />
                  <datalist id="gallery-albums">
                    {existingAlbums.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Ngày diễn ra (dương lịch)</label>
                  <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
                </div>
              </div>

              {branches.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Thuộc chi / nhánh</label>
                  <select
                    value={branchId ?? ""}
                    onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                    className={inputCls}
                  >
                    <option value="">— Chung cả họ —</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <PeoplePicker value={people} onChange={setPeople} />

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Lời kể / mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-y`}
                  placeholder="Kể lại câu chuyện đằng sau bức ảnh…"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-stone-200 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isPublic}
                  onChange={(e) => setIsPublic(!e.target.checked)}
                  className="mt-0.5 size-4 accent-amber-600"
                />
                <span className="text-sm">
                  <span className="font-semibold text-stone-700">Chỉ cho người đã đăng nhập xem</span>
                  <span className="block text-stone-500">
                    Bỏ chọn nếu muốn khách (chưa đăng nhập) cũng xem được ảnh này.
                  </span>
                </span>
              </label>
            </form>

            <div className="flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-stone-100 bg-stone-50">
              {progress && <span className="mr-auto text-sm text-stone-500">{progress}</span>}
              <button type="button" onClick={onClose} disabled={busy} className="btn">
                Huỷ
              </button>
              <button type="submit" form="gallery-form" disabled={!canSubmit} className="btn-primary disabled:opacity-50">
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {busy ? "Đang lưu…" : isEdit ? "Lưu thay đổi" : files.length > 1 ? `Lưu ${files.length} ảnh` : "Lưu ảnh"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Gắn tên thành viên có trong ảnh (tìm trực tiếp trên bảng persons). */
function PeoplePicker({
  value,
  onChange,
}: {
  value: { id: string; full_name: string }[];
  onChange: (v: { id: string; full_name: string }[]) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<{ id: string; full_name: string; birth_year: number | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const selectedIds = useMemo(() => new Set(value.map((v) => v.id)), [value]);

  const q = term.trim().replace(/[,()%*.]/g, " ").trim();
  const visibleResults = q.length >= 2 ? results : [];

  useEffect(() => {
    if (q.length < 2) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("persons")
        .select("id, full_name, birth_year")
        .or(`full_name.ilike.%${q}%,other_names.ilike.%${q}%`)
        .order("generation", { ascending: true, nullsFirst: false })
        .limit(10);
      setResults(data ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-1.5">Người trong ảnh</label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-sm text-amber-800"
            >
              {p.full_name}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.id !== p.id))}
                className="p-0.5 rounded-full hover:bg-amber-100"
                aria-label={`Bỏ ${p.full_name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className={`${inputCls} pl-9`}
          placeholder="Gõ tên để tìm và gắn (không bắt buộc)…"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-stone-400" />}
      </div>
      {visibleResults.length > 0 && (
        <ul className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white shadow-sm divide-y divide-stone-100">
          {visibleResults.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                disabled={selectedIds.has(r.id)}
                onClick={() => {
                  onChange([...value, { id: r.id, full_name: r.full_name }]);
                  setTerm("");
                  setResults([]);
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-amber-50 disabled:opacity-40"
              >
                {r.full_name}
                {r.birth_year ? <span className="text-stone-400"> · {r.birth_year}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
