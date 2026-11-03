"use client";

import { useDashboard } from "@/components/DashboardContext";
import { GalleryItem } from "@/types";
import { formatGalleryDate } from "@/utils/gallery";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  GitBranch,
  Lock,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  items: GalleryItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  personMap: Map<string, string>;
  branchMap: Map<number, string>;
  canModify: (item: GalleryItem) => boolean;
  onEdit: (item: GalleryItem) => void;
  onDelete: (item: GalleryItem) => Promise<boolean>;
}

export default function GalleryLightbox({
  items,
  index,
  onIndexChange,
  onClose,
  personMap,
  branchMap,
  canModify,
  onEdit,
  onDelete,
}: Props) {
  const item = items[index];
  const { setMemberModalId, memberModalId } = useDashboard();
  const [deleting, setDeleting] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (delta: number) => {
    if (items.length < 2) return;
    onIndexChange((index + delta + items.length) % items.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (memberModalId) return; // đang mở hồ sơ thành viên phía trên
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length, memberModalId]);

  if (!item) return null;

  const people = (item.person_ids ?? [])
    .map((id) => ({ id, name: personMap.get(id) }))
    .filter((p): p is { id: string; name: string } => !!p.name);

  return (
    <div className="fixed inset-0 z-90 flex flex-col lg:flex-row bg-stone-950" role="dialog" aria-modal="true">
      {/* Ảnh */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center p-2 sm:p-6"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx > 0 ? -1 : 1);
          touchX.current = null;
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={item.id}
          src={item.image_url}
          alt={item.title}
          className="max-w-full max-h-full object-contain rounded-md select-none"
          draggable={false}
        />

        {items.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/25"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/25"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="size-6" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white/90">
              {index + 1} / {items.length}
            </span>
          </>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25"
          aria-label="Đóng"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* Thông tin */}
      <aside className="w-full lg:w-96 max-h-[42vh] lg:max-h-none overflow-y-auto bg-white flex flex-col">
        <div className="p-5 sm:p-6 flex-1 space-y-4">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-800 leading-tight">{item.title}</h2>

          <div className="space-y-2 text-sm text-stone-600">
            {item.event_date && (
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-amber-600" />
                {formatGalleryDate(item.event_date)}
              </p>
            )}
            {item.album && (
              <p className="flex items-center gap-2">
                <FolderOpen className="size-4 text-amber-600" />
                {item.album}
              </p>
            )}
            {item.branch_id != null && branchMap.get(item.branch_id) && (
              <p className="flex items-center gap-2">
                <GitBranch className="size-4 text-amber-600" />
                {branchMap.get(item.branch_id)}
              </p>
            )}
            {!item.is_public && (
              <p className="flex items-center gap-2 text-stone-500">
                <Lock className="size-4" />
                Ảnh nội bộ — chỉ người đã đăng nhập mới xem được
              </p>
            )}
          </div>

          {people.length > 0 && (
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                <Users className="size-4 text-amber-600" /> Người trong ảnh
              </p>
              <div className="flex flex-wrap gap-1.5">
                {people.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setMemberModalId(p.id)}
                    className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-sm hover:bg-amber-100 border border-amber-200/60"
                    title="Xem thông tin thành viên"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {item.description ? (
            <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{item.description}</p>
          ) : (
            <p className="text-stone-400 italic text-sm">Chưa có lời kể cho ảnh này.</p>
          )}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-stone-100 bg-stone-50 flex flex-wrap items-center gap-2">
          <a
            href={item.image_url}
            target="_blank"
            rel="noopener"
            download
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100"
          >
            <Download className="size-4" /> Tải ảnh
          </a>
          {canModify(item) && (
            <>
              <button
                onClick={() => onEdit(item)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100"
              >
                <Pencil className="size-4" /> Sửa
              </button>
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await onDelete(item);
                  setDeleting(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="size-4" /> {deleting ? "Đang xoá…" : "Xoá"}
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
