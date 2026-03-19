"use client";

import { Person } from "@/types";
import { Minus, Plus, Info, TreePine, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useDashboard } from "./DashboardContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import DefaultAvatar from "./DefaultAvatar";

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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDeceased = person.is_deceased;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle click to change root
  const handleRootChange = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("rootId", person.id);
    const newUrl = `${pathname}?${sp.toString()}`;
    router.push(newUrl);
    // Force refresh to ensure tree re-renders with new root
    setTimeout(() => {
      window.location.href = newUrl;
    }, 100);
    setShowMenu(false);
  };

  // Handle click to show modal
  const handleShowInfo = () => {
    setMemberModalId(person.id);
    setShowMenu(false);
  };

  const content = (
    <div
      onClick={onClickCard}
      className={`group py-2 px-1 w-20 sm:w-24 md:w-28 flex flex-col items-center justify-start transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative bg-white/70 rounded-2xl
        ${isDeceased ? "grayscale-[0.4] opacity-80" : ""}
      `}
    >
      {isRingVisible && (
        <div className="absolute top-[15%] -left-2.5 sm:-left-4 size-5 sm:size-6 rounded-full shadow-sm bg-white z-100 flex items-center justify-center text-[10px] sm:text-sm">
          <span className="leading-none pt-px pl-0.5">💍</span>
        </div>
      )}
      {isPlusVisible && (
        <div className="absolute top-[15%] -left-2.5 sm:-left-4 size-5 sm:size-6 rounded-full shadow-sm bg-white z-100 flex items-center justify-center text-[10px] sm:text-sm font-medium text-stone-500">
          <span className="leading-none mb-px pl-0.5">+</span>
        </div>
      )}
      {/* Decorative gradient blob for the card background hover */}
      {/* <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0 ${person.gender === "male" ? "bg-sky-400" : person.gender === "female" ? "bg-rose-400" : "bg-stone-400"}`}
      /> */}

      {/* Expand/Collapse Indicator */}
      {isExpandable && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-stone-200/80 rounded-full size-6 flex items-center justify-center shadow-md z-100 text-stone-500 hover:text-amber-600 transition-colors">
          {isExpanded ? (
            <Minus className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
        </div>
      )}

      {/* 1. Avatar */}
      {showAvatar && (
        <div className="relative z-10 mb-1.5 sm:mb-2">
          <div
            className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm text-white overflow-hidden shrink-0 shadow-lg ring-2 ring-white transition-transform duration-300 group-hover:scale-105
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
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            ) : (
              <DefaultAvatar gender={person.gender} />
            )}
          </div>
        </div>
      )}

      {/* 2. Name and other info */}
      <div className="relative z-10 text-center">
        {onClickName ? (
          <button
            onClick={onClickName}
            className="text-[10px] sm:text-xs md:text-sm font-bold text-stone-700 hover:text-amber-600 transition-colors leading-tight line-clamp-2"
          >
            {person.full_name}
          </button>
        ) : (
          <p className="text-[10px] sm:text-xs md:text-sm font-bold text-stone-700 leading-tight line-clamp-2">
            {person.full_name}
          </p>
        )}
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

        {/* Action Menu Button */}
        {!onClickCard && !onClickName && (
          <div className="relative mt-1" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="flex items-center gap-1 text-[9px] sm:text-[10px] text-stone-500 hover:text-amber-600 transition-colors bg-white/80 rounded-full px-2 py-0.5 shadow-sm border border-stone-200/60"
            >
              <ChevronDown className="size-3" />
              Hành động
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                <button
                  onClick={handleShowInfo}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Info className="size-3" />
                  Xem thông tin
                </button>
                <button
                  onClick={handleRootChange}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <TreePine className="size-3" />
                  Đặt làm gốc
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (onClickCard || onClickName) {
    return content;
  }

  return <div className="block w-fit">{content}</div>;
}
