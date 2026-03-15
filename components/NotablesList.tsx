"use client";

import PersonCard from "@/components/PersonCard";
import HeroImage from "@/components/HeroImage";
import { Person } from "@/types";
import { ArrowUpDown, Users } from "lucide-react";
import { useMemo, useState } from "react";

type SortKey =
  | "generation_asc"
  | "generation_desc"
  | "name_asc"
  | "name_desc"
  | "birth_asc"
  | "birth_desc"
  | "updated_asc"
  | "updated_desc";

export default function NotablesList({ persons }: { persons: Person[] }) {
  const [sortOption, setSortOption] = useState<SortKey>("generation_asc");

  // Filter only notable persons
  const filteredPersons = useMemo(() => {
    return persons.filter((person) => {
      // Only show notable persons
      return person.is_notable === true;
    });
  }, [persons]);

  // Sort filtered persons
  const sortedPersons = useMemo(() => {
    return [...filteredPersons].sort((a, b) => {
      switch (sortOption) {
        case "generation_asc":
          return (a.generation || 0) - (b.generation || 0);
        case "generation_desc":
          return (b.generation || 0) - (a.generation || 0);
        case "name_asc":
          return a.full_name.localeCompare(b.full_name);
        case "name_desc":
          return b.full_name.localeCompare(a.full_name);
        case "birth_asc":
          return (a.birth_year || 0) - (b.birth_year || 0);
        case "birth_desc":
          return (b.birth_year || 0) - (a.birth_year || 0);
        case "updated_asc":
          return (
            new Date(a.updated_at || 0).getTime() -
            new Date(b.updated_at || 0).getTime()
          );
        case "updated_desc":
        default:
          return (
            new Date(b.updated_at || 0).getTime() -
            new Date(a.updated_at || 0).getTime()
          );
      }
    });
  }, [filteredPersons, sortOption]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="size-6 text-amber-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Danh nhân dòng họ
          </h1>
        </div>
        <p className="text-stone-600 max-w-2xl">
          Những thành viên nổi bật của dòng họ, có đóng góp quan trọng và được
          ghi nhận trong lịch sử gia tộc. (kéo xuống để xem danh sách)
        </p>
      </div>

      {/* Hero Image */}
      <HeroImage
        src="/assets/images/notable.png"
        alt="Danh nhân dòng họ Phạm Đông Ngạc"
      />

      {/* Sort Controls */}
      <div className="mb-8 relative">
        <div className="flex justify-end items-center gap-4 bg-white/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-200/60 transition-all duration-300 relative z-10 w-full">
          <div className="relative w-full sm:w-auto">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            <select
              className="appearance-none bg-white/90 text-stone-700 w-full sm:w-52 pl-9 pr-8 py-2.5 rounded-xl border border-stone-200/80 shadow-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 hover:border-amber-300 font-medium text-sm transition-all focus:bg-white"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortKey)}
            >
              <option value="generation_asc">Đời (Tăng dần)</option>
              <option value="generation_desc">Đời (Giảm dần)</option>
              <option value="name_asc">Tên (A-Z)</option>
              <option value="name_desc">Tên (Z-A)</option>
              <option value="birth_asc">Năm sinh (Tăng dần)</option>
              <option value="birth_desc">Năm sinh (Giảm dần)</option>
              <option value="updated_desc">Cập nhật (Mới nhất)</option>
              <option value="updated_asc">Cập nhật (Cũ nhất)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="size-4 text-stone-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6 text-center">
        <p className="text-sm text-stone-600">
          {filteredPersons.length > 0 ? (
            <>
              Có{" "}
              <span className="font-semibold text-amber-700">
                {filteredPersons.length}
              </span>{" "}
              danh nhân trong gia phả
            </>
          ) : (
            <>Chưa có danh nhân nào trong gia phả</>
          )}
        </p>
      </div>

      {/* Notables Grid */}
      {sortedPersons.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedPersons.map((person) => (
            <div key={person.id} className="relative">
              {/* Notable Badge */}
              <div className="absolute -top-2 -right-2 z-20">
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
                  Danh nhân
                </div>
              </div>
              <PersonCard person={person} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="size-16 text-stone-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-stone-600 mb-2">
            Chưa có danh nhân
          </h3>
          <p className="text-stone-500 max-w-md mx-auto">
            Các thành viên nổi bật sẽ được hiển thị tại đây khi được đánh dấu là
            danh nhân trong form chỉnh sửa thông tin.
          </p>
        </div>
      )}
    </div>
  );
}
