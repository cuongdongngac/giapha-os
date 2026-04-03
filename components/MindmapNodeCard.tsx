"use client";

import { Person } from "@/types";
import DefaultAvatar from "./DefaultAvatar";
import { Search } from "lucide-react";
import Link from "next/link";

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
  return (
    <div
      className={`group/card relative flex flex-col gap-2 bg-white/60 rounded-2xl border border-stone-200/60 p-2 sm:p-2.5 shadow-sm hover:border-amber-300 hover:shadow-md hover:bg-white/90 transition-all duration-300 overflow-visible
        ${isDeceased ? "opacity-80 grayscale-[0.3]" : ""}`}
    >
      {/* Main node content - click to set as root */}
      <div
        className="flex items-center gap-2.5 relative z-10 w-full cursor-pointer"
        onClick={onSetRoot}
      >
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          {showAvatar && (
            <div
              className="relative shrink-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onShowInfo();
              }}
            >
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
      </div>

      {/* Truy Vết Tổ Tiên Button - Hidden by default, shown on hover */}
      <Link
        href={`/dashboard/lineage-trace?personId=${person.id}`}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1 right-1 p-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm shadow-amber-200 transition-all opacity-0 group-hover/card:opacity-100 z-50"
        title={`Truy vết tổ tiên ${person.full_name}`}
      >
        <Search className="size-3" />
      </Link>
    </div>
  );
}
