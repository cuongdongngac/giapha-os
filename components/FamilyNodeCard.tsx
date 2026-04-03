"use client";

import { Person } from "@/types";
import Image from "next/image";
import { useDashboard } from "./DashboardContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DefaultAvatar from "./DefaultAvatar";
import { Search } from "lucide-react";
import Link from "next/link";

interface FamilyNodeCardProps {
  person: Person;
  role?: string; // e.g., "Chồng", "Vợ"
  note?: string | null;
  onClickCard?: () => void;
  onClickName?: (e: React.MouseEvent) => void;
  isExpandable?: boolean;
  isExpanded?: boolean;
  isRingVisible?: boolean;
  isPlusVisible?: boolean;
}

export default function FamilyNodeCard({
  person,
  role,
  note,
  onClickCard,
  onClickName,
  isExpandable = false,
  isExpanded = false,
  isRingVisible = false,
  isPlusVisible = false,
}: FamilyNodeCardProps) {
  const { showAvatar, setMemberModalId } = useDashboard();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isDeceased = person.is_deceased;

  // Handle click to change root
  const handleRootChange = (e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn sự kiện nổi lên container cha
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("rootId", person.id);
    const newUrl = `${pathname}?${sp.toString()}`;
    router.push(newUrl);
    // Force refresh to ensure tree re-renders with new root
    setTimeout(() => {
      window.location.href = newUrl;
    }, 100);
  };

  // Handle click to show modal
  const handleShowInfo = () => {
    setMemberModalId(person.id);
  };

  const content = (
    <div
      onClick={(e) => {
        if (onClickCard) {
          onClickCard();
        } else {
          handleRootChange(e);
        }
      }}
      className={`group py-2 px-1 w-20 sm:w-24 md:w-28 flex flex-col items-center justify-start transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative bg-white/70 rounded-2xl cursor-pointer
        ${isDeceased ? "grayscale-[0.4] opacity-80" : ""}
      `}
    >
      {isRingVisible && (
        <div className="absolute top-[15%] -left-2.5 sm:-left-4 size-5 sm:size-6 rounded-full shadow-sm bg-white z-100 flex items-center justify-center text-[10px] sm:text-sm">
          <span className="leading-none pt-px pl-0.5">💍</span>
        </div>
      )}

      {isPlusVisible && (
        <div className="absolute top-[15%] -left-2.5 sm:-left-4 size-5 sm:size-6 rounded-full shadow-sm bg-white z-100 flex items-center justify-center text-[10px] sm:text-sm font-bold text-amber-600">
          <span className="leading-none">+</span>
        </div>
      )}

      {/* Avatar and Name Section - Main Click Area */}
      <div className="flex flex-col items-center gap-1">
        {showAvatar && (
          <div
            className="relative shrink-0 cursor-pointer"
            onClick={(e) => {
              if (!onClickCard && !onClickName) {
                e.stopPropagation();
                handleShowInfo();
              }
            }}
          >
            <div
              className={`size-8 sm:size-10 rounded-full overflow-hidden flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shadow-md ring-2 ring-white transition-transform duration-300 group-hover:scale-105
                ${
                  person.gender === "male"
                    ? "bg-linear-to-br from-sky-400 to-sky-700"
                    : person.gender === "female"
                      ? "bg-linear-to-br from-rose-400 to-rose-700"
                      : "bg-linear-to-br from-stone-400 to-stone-600"
                }`}
            >
              {person.avatar_url ? (
                <Image
                  unoptimized
                  src={person.avatar_url}
                  alt={person.full_name}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <DefaultAvatar gender={person.gender} />
              )}
            </div>
          </div>
        )}
        <span
          onClick={onClickName}
          className={`font-bold text-[10px] sm:text-xs md:text-sm text-stone-800 group-hover:text-amber-600 transition-colors text-center leading-tight line-clamp-2 w-full
            ${onClickName ? "cursor-pointer" : ""}`}
        >
          {person.full_name}
        </span>
      </div>

      {/* Truy Vết Tổ Tiên Button - Hidden by default, shown on hover */}
      <Link
        href={`/dashboard/lineage-trace?personId=${person.id}`}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 p-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm shadow-amber-200 transition-all opacity-0 group-hover:opacity-100 z-50"
        title={`Truy vết tổ tiên ${person.full_name}`}
      >
        <Search className="size-3" />
      </Link>

      {/* Info Section */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        {person.birth_year && (
          <p className="text-[9px] sm:text-[10px] md:text-xs text-stone-500 leading-tight">
            {person.birth_year}
          </p>
        )}
        {role && (
          <p className="text-[9px] sm:text-[10px] md:text-xs text-stone-500 leading-tight">
            {role}
          </p>
        )}
        {note && (
          <p className="text-[9px] sm:text-[10px] md:text-xs text-amber-600 leading-tight">
            {note}
          </p>
        )}
      </div>
    </div>
  );

  if (onClickCard || onClickName) {
    return content;
  }

  return <div className="block w-fit">{content}</div>;
}
