"use client";

import HelpLink from "@/components/HelpLink";
import { BranchOption, GalleryItem, GalleryPersonRef } from "@/types";
import { formatGalleryDate, galleryPathFromItem, removeGalleryFile } from "@/utils/gallery";
import { createClient } from "@/utils/supabase/client";
import { CalendarDays, Clock, Images, LayoutGrid, Lock, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import GalleryLightbox from "./GalleryLightbox";
import GalleryUploadModal from "./GalleryUploadModal";

type ViewMode = "grid" | "timeline";

interface Props {
  initialItems: GalleryItem[];
  persons: GalleryPersonRef[];
  branches: BranchOption[];
  currentUserId: string | null;
  isAdmin: boolean;
  canUpload: boolean;
  isLoggedIn: boolean;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

export default function GalleryClient({
  initialItems,
  persons,
  branches,
  currentUserId,
  isAdmin,
  canUpload,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  // Ảnh vừa xoá: ẩn ngay, không chờ router.refresh()
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const items = useMemo(() => initialItems.filter((i) => !deletedIds.has(i.id)), [initialItems, deletedIds]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [album, setAlbum] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);

  const personMap = useMemo(() => new Map(persons.map((p) => [p.id, p.full_name])), [persons]);
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);

  const albums = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((i) => i.album && counts.set(i.album, (counts.get(i.album) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], "vi"));
  }, [items]);

  const usedBranchIds = useMemo(
    () => new Set(items.map((i) => i.branch_id).filter((x): x is number => x != null)),
    [items],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return items.filter((i) => {
      if (album && i.album !== album) return false;
      if (branchId != null && i.branch_id !== branchId) return false;
      if (!q) return true;
      const hay = [
        i.title,
        i.description ?? "",
        i.album ?? "",
        ...(i.person_ids ?? []).map((id) => personMap.get(id) ?? ""),
      ].join(" ");
      return normalize(hay).includes(q);
    });
  }, [items, album, branchId, query, personMap]);

  const timeline = useMemo(() => {
    const groups = new Map<string, GalleryItem[]>();
    filtered.forEach((i) => {
      const key = i.event_date ? i.event_date.slice(0, 4) : "Chưa rõ ngày";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(i);
    });
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === "Chưa rõ ngày") return 1;
      if (b[0] === "Chưa rõ ngày") return -1;
      return b[0].localeCompare(a[0]);
    });
  }, [filtered]);

  const canModify = (item: GalleryItem) =>
    isAdmin || (canUpload && !!currentUserId && item.created_by === currentUserId);

  const openItem = (item: GalleryItem) => setOpenIndex(filtered.findIndex((i) => i.id === item.id));

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Xoá ảnh "${item.title}"? Thao tác này không thể hoàn tác.`)) return false;
    const supabase = createClient();
    const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);
    if (error) {
      alert("Không xoá được ảnh: " + error.message);
      return false;
    }
    await removeGalleryFile(supabase, galleryPathFromItem(item));
    setDeletedIds((prev) => new Set(prev).add(item.id));
    setOpenIndex(null);
    router.refresh();
    return true;
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    router.refresh();
  };

  const card = (item: GalleryItem, tall = false) => (
    <button
      key={item.id}
      type="button"
      onClick={() => openItem(item)}
      className={`group relative block w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm hover:shadow-xl transition-all duration-300 text-left ${
        tall ? "break-inside-avoid mb-4" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.title}
        loading="lazy"
        width={item.width ?? undefined}
        height={item.height ?? undefined}
        className={`w-full transition-transform duration-500 group-hover:scale-105 ${
          tall ? "h-auto" : "aspect-4/3 object-cover"
        }`}
      />
      {!item.is_public && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
          <Lock className="size-3" /> Nội bộ
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-stone-900/85 via-stone-900/30 to-transparent p-4 pt-10">
        <p className="text-white font-semibold leading-snug line-clamp-2">{item.title}</p>
        {item.event_date && (
          <p className="mt-0.5 text-xs text-stone-200 flex items-center gap-1">
            <CalendarDays className="size-3" />
            {formatGalleryDate(item.event_date)}
          </p>
        )}
      </div>
    </button>
  );

  const hasFilter = !!album || branchId != null || !!query;

  return (
    <>
      {/* Tiêu đề + nút */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800 flex items-center gap-2">
            <Images className="size-7 text-amber-600" />
            Thư viện ảnh
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            Lưu giữ hình ảnh giỗ chạp, họp họ, nhà thờ, mộ phần và kỷ niệm của dòng họ.{" "}
            <HelpLink slug="xem/thu-vien-anh" label="Hướng dẫn" className="ml-1" />
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-stone-100 rounded-full border border-stone-200/60">
            {(
              [
                ["grid", "Lưới", LayoutGrid],
                ["timeline", "Theo năm", Clock],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  viewMode === mode ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
          {canUpload && (
            <button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="size-4" />
              Thêm ảnh
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc */}
      {items.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung, tên người trong ảnh…"
                className="w-full rounded-full border border-stone-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            {usedBranchIds.size > 0 && (
              <select
                value={branchId ?? ""}
                onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : null)}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm outline-none focus:border-amber-500"
              >
                <option value="">Tất cả các chi</option>
                {branches
                  .filter((b) => usedBranchIds.has(b.id))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {albums.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAlbum(null)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  !album ? "bg-amber-600 text-white border-amber-600" : "bg-white text-stone-600 border-stone-200 hover:border-amber-300"
                }`}
              >
                Tất cả ({items.length})
              </button>
              {albums.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setAlbum(album === name ? null : name)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    album === name
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-stone-600 border-stone-200 hover:border-amber-300"
                  }`}
                >
                  {name} ({count})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nội dung */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-stone-100 shadow-sm">
          <div className="size-20 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <Images className="size-9 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-stone-700 mb-2">Chưa có ảnh nào</h3>
          <p className="text-stone-500 max-w-sm">
            {canUpload
              ? "Bấm “Thêm ảnh” để lưu lại những khoảnh khắc đầu tiên của dòng họ."
              : isLoggedIn
                ? "Khi Ban biên tập đăng ảnh, ảnh sẽ hiện ở đây."
                : "Hiện chưa có ảnh công khai. Đăng nhập để xem thêm ảnh nội bộ (nếu có)."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          Không có ảnh phù hợp.
          {hasFilter && (
            <button
              onClick={() => {
                setAlbum(null);
                setBranchId(null);
                setQuery("");
              }}
              className="ml-2 inline-flex items-center gap-1 text-amber-700 hover:underline"
            >
              <X className="size-4" /> Bỏ lọc
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="columns-2 md:columns-3 xl:columns-4 gap-4">{filtered.map((i) => card(i, true))}</div>
      ) : (
        <div className="space-y-10">
          {timeline.map(([year, list]) => (
            <section key={year}>
              <h2 className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-stone-50/90 backdrop-blur-sm font-serif text-2xl font-bold text-stone-800 flex items-baseline gap-2">
                {year}
                <span className="text-sm font-sans font-normal text-stone-400">{list.length} ảnh</span>
              </h2>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {list.map((i) => card(i))}
              </div>
            </section>
          ))}
        </div>
      )}

      {openIndex !== null && filtered[openIndex] && (
        <GalleryLightbox
          items={filtered}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          personMap={personMap}
          branchMap={branchMap}
          canModify={canModify}
          onEdit={(item) => {
            setOpenIndex(null);
            setEditing(item);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {canUpload && (
        <GalleryUploadModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
          initialData={editing}
          branches={branches}
          personMap={personMap}
          existingAlbums={albums.map(([name]) => name)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
