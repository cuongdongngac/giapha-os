"use client";

import { Person } from "@/types";
import { Info, TreePine, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import DefaultAvatar from "./DefaultAvatar";

interface MindmapNodeCardProps {
  person: Person;
  showAvatar: boolean;
  onShowInfo: () => void;
  onSetRoot: () => void;
  isDeceased?: boolean;
}

export default function MindmapNodeCard({
  person,
  showAvatar,
  onShowInfo,
  onSetRoot,
  isDeceased = false,
}: MindmapNodeCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className={`group/card relative flex flex-wrap items-center gap-2 bg-white/60 rounded-2xl border border-stone-200/60 p-2 sm:p-2.5 shadow-sm hover:border-amber-300 hover:shadow-md hover:bg-white/90 transition-all duration-300 overflow-visible
        ${isDeceased ? "opacity-80 grayscale-[0.3]" : ""}`}
    >
      <div className="flex items-center gap-2.5 relative z-10 w-full">
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          {showAvatar && (
            <div className="relative shrink-0">
              <div
                className={`size-10 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white transition-transform duration-300 group-hover/card:scale-105
                  ${
                    person.gender === "male"
                      ? "bg-linear-to-br from-sky-400 to-sky-700"
                      : person.gender === "female"
                        ? "bg-linear-to-br from-rose-400 to-rose-700"
                        : "bg-linear-to-br from-stone-400 to-stone-600"
                  }`}
              >
                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <DefaultAvatar gender={person.gender} />
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-[14px] text-stone-900 group-hover/card:text-amber-700 transition-colors leading-tight truncate mb-0.5">
              {person.full_name}
            </span>
            <span className="text-[11px] text-stone-500 font-medium truncate flex items-center gap-1">
              <svg
                className="size-3 text-stone-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {person.birth_year || "N/A"}
            </span>
            {person.generation != null && (
              <span className="text-[10px] text-stone-400 font-medium">
                Đời thứ {person.generation}
              </span>
            )}
          </div>
        </div>

        {/* Action Menu Button */}
        <div className="relative mt-1" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="flex items-center gap-1 text-[9px] text-stone-500 hover:text-amber-600 transition-colors bg-white/80 rounded-full px-2 py-0.5 shadow-sm border border-stone-200/60"
          >
            <ChevronDown className="size-3" />
            Hành động
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-[9999] min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowInfo();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Info className="size-3" />
                Xem thông tin
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetRoot();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <TreePine className="size-3" />
                Đặt làm gốc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
