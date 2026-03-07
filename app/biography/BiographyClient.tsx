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
  const [biographyDraft, setBiographyDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!personId) return;

    const fetchData = async () => {
      setLoading(true);

      // Load person
      const { data: person } = await supabase
        .from("persons")
        .select("full_name")
        .eq("id", personId)
        .single();

      if (person) {
        setPersonName(person.full_name);
      }

      // Load biography
      const { data: bio } = await supabase
        .from("person_biography")
        .select("biography_html")
        .eq("person_id", personId)
        .maybeSingle();

      if (bio?.biography_html) {
        setBiographyHtml(bio.biography_html);
        setBiographyDraft(bio.biography_html);
      }

      setLoading(false);
    };

    fetchData();
  }, [personId, supabase]);

  const saveBiography = async () => {
    if (!personId) return;

    setSaving(true);

    const { error } = await supabase
      .from("person_biography")
      .upsert({
        person_id: personId,
        biography_html: biographyDraft,
      });

    if (!error) {
      setBiographyHtml(biographyDraft);
      setIsEditing(false);
    }

    setSaving(false);
  };

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

        {/* Back */}
        <Link
          href={`/dashboard?memberModalId=${personId}`}
          className="flex items-center gap-1.5 px-4 py-2 bg-stone-100/80 text-stone-700 rounded-full hover:bg-stone-200 font-semibold text-sm shadow-sm border border-stone-200/50 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">
            Quay lại: {personName}
          </span>
        </Link>

        {/* Action */}
        {!isEditing && (
          biographyHtml ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-100/80 text-amber-800 rounded-full hover:bg-amber-200 font-semibold text-sm shadow-sm border border-amber-200/50 transition-colors"
            >
              <Edit2 className="size-4" />
              <span>Sửa tiểu sử</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-100/80 text-amber-800 rounded-full hover:bg-amber-200 font-semibold text-sm shadow-sm border border-amber-200/50 transition-colors"
            >
              <Plus className="size-4" />
              <span>Thêm tiểu sử</span>
            </button>
          )
        )}

      </div>

      {/* Content */}
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-stone-200 p-8">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

        ) : isEditing ? (

          <>
           <h1 className="text-2xl font-serif font-bold text-stone-800 mb-6">
  {biographyHtml ? "Chỉnh sửa tiểu sử" : "Thêm tiểu sử"} — {personName}
</h1>

            <textarea
              value={biographyDraft}
              onChange={(e) => setBiographyDraft(e.target.value)}
              className="w-full h-[420px] p-4 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Nhập tiểu sử..."
            />

            <div className="flex justify-end gap-3 mt-4">

              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-stone-100 rounded-full hover:bg-stone-200 font-semibold"
              >
                Hủy
              </button>

              <button
                onClick={saveBiography}
                disabled={saving}
                className="px-4 py-2 bg-amber-600 text-white rounded-full hover:bg-amber-700 font-semibold"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>

            </div>
          </>

        ) : biographyHtml ? (

          <div
            className="prose max-w-none"
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