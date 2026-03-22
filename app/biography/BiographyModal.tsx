"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function BiographyClient() {
  const searchParams = useSearchParams();
  const personId = searchParams.get("person_id");

  const supabase = createClient();

  const [personName, setPersonName] = useState("");
  const [biographyHtml, setBiographyHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;

    const fetchData = async () => {
      setLoading(true);

      // lấy person
      const { data: person } = await supabase
        .from("persons")
        .select("name")
        .eq("id", personId)
        .single();

      if (person) {
        setPersonName(person.name);
      }

      // lấy biography
      const { data: bio } = await supabase
        .from("person_biography")
        .select("biography_html")
        .eq("person_id", personId)
        .single();

      if (bio) {
        setBiographyHtml(bio.biography_html);
      }

      setLoading(false);
    };

    fetchData();
  }, [personId, supabase]);

  if (!personId) {
    return (
      <div className="p-10 text-center text-stone-500">
        Không tìm thấy person_id
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">

        {/* Back button */}
        <Link
          href={`/dashboard?memberModalId=${personId}`}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-100/80 text-stone-700 rounded-full hover:bg-stone-200 font-semibold text-sm shadow-sm border border-stone-200/50 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">
            Quay lại {personName}
          </span>
        </Link>

        {/* Action */}
        {biographyHtml ? (
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-100/80 text-amber-800 rounded-full hover:bg-amber-200 font-semibold text-sm shadow-sm border border-amber-200/50 transition-colors">
            <Edit2 className="size-4" />
            <span>Sửa tiểu sử</span>
          </button>
        ) : (
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-100/80 text-amber-800 rounded-full hover:bg-amber-200 font-semibold text-sm shadow-sm border border-amber-200/50 transition-colors">
            <Plus className="size-4" />
            <span>Thêm tiểu sử</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-stone-200 p-8">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : biographyHtml ? (
          <div
            className="rendered-html-content max-w-none"
            dangerouslySetInnerHTML={{ __html: biographyHtml }}
          />
        ) : (
          <div className="text-center text-stone-500 py-20">
            Thành viên này chưa có tiểu sử.
          </div>
        )}
      </div>
    </div>
  );
}