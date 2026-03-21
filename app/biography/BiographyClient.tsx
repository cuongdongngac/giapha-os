"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, BookOpen, User, Clock, Save, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import RichTextEditor from "@/components/editor/RichTextEditor";
import AudioPlayer from "@/components/AudioPlayer";

export default function BiographyClient() {
  const searchParams = useSearchParams();
  const personId = searchParams.get("person_id");

  const supabase = createClient();

  const [personName, setPersonName] = useState("");
  const [biographyHtml, setBiographyHtml] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [audioDraft, setAudioDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!personId) return;

    const fetchData = async () => {
      setLoading(true);

      // Check admin role
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setIsAdmin(profile?.role === "admin");
      }

      // Lấy thông tin person
      const { data: person } = await supabase
        .from("persons")
        .select("full_name")
        .eq("id", personId)
        .single();

      if (person) {
        setPersonName(person.full_name);
      }

      // Lấy biography + audio
      const { data: bio } = await supabase
        .from("person_biography")
        .select("biography_html, audio_url")
        .eq("person_id", personId)
        .maybeSingle();

      if (bio) {
        if (bio.biography_html) {
          setBiographyHtml(bio.biography_html);
          setDraft(bio.biography_html);
        }

        if (bio.audio_url) {
          setAudioUrl(bio.audio_url);
          setAudioDraft(bio.audio_url);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [personId, supabase]);

  const saveBiography = async () => {
    if (!personId) return;

    setSaving(true);

    const { error } = await supabase.from("person_biography").upsert({
      person_id: personId,
      biography_html: draft,
      audio_url: audioDraft || null,
    });

    if (!error) {
      setBiographyHtml(draft);
      setAudioUrl(audioDraft || null);
      setIsEditing(false);
    }

    setSaving(false);
  };

  if (!personId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Không tìm thấy person_id</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard?memberModalId=${personId}`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Quay lại {personName}</span>
            </Link>

            {!isEditing && isAdmin && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setAudioDraft(audioUrl || ""); // Set current audio URL when entering edit mode
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
              >
                <Edit2 className="w-4 h-4" />
                <span>Cập nhật tiểu sử</span>
              </button>
            )}
          </div>

          <div className="text-center mt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Tiểu Sử</h1>
            <p className="text-xl text-gray-600">{personName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Đang tải tiểu sử...</p>
            </div>
          ) : isEditing ? (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {biographyHtml ? "Chỉnh sửa tiểu sử" : "Thêm tiểu sử"}
                </h2>
              </div>

              {/* Editor */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung tiểu sử
                </label>
                <div className="bg-gray-50 rounded-lg p-1">
                  <RichTextEditor value={draft} onChange={setDraft} />
                </div>
              </div>

              {/* Audio URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Audio (tùy chọn)
                </label>
                <input
                  type="url"
                  value={audioDraft}
                  onChange={(e) => setAudioDraft(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                  placeholder="Nhập URL file audio (ví dụ: https://example.com/audio.mp3)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nhập URL đầy đủ của file audio. Bỏ trống nếu không có audio.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Tự động lưu nháp</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={saveBiography}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Đang lưu..." : "Lưu"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : biographyHtml ? (
            <div className="p-8">
              {/* Audio Player */}
              {audioUrl && (
                <div className="mb-8">
                  <AudioPlayer
                    title={`🔊 Nghe tiểu sử ${personName}`}
                    src={audioUrl}
                  />
                </div>
              )}

              {/* Biography Content */}
              <div className="prose prose-lg max-w-none">
                <div
                  className="ProseMirror"
                  dangerouslySetInnerHTML={{ __html: biographyHtml }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Chưa có tiểu sử
              </h3>
              <p className="text-gray-500 mb-6">
                Thành viên này chưa có tiểu sử.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-md"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Thêm tiểu sử</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && !isEditing && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
          </div>
        )}

        {/* TipTap content styles */}
        <style jsx global>{`
          .ProseMirror {
            font-family:
              "Inter",
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Roboto,
              sans-serif;
            line-height: 1.6;
            color: #374151;
          }
          .ProseMirror h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
            color: #111827;
            border-bottom: 2px solid #f59e0b;
            padding-bottom: 8px;
          }
          .ProseMirror h2 {
            font-size: 26px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1f2937;
            margin-top: 24px;
          }
          .ProseMirror h3 {
            font-size: 22px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #374151;
            margin-top: 20px;
          }
          .ProseMirror p {
            margin-bottom: 16px;
            line-height: 1.7;
          }
          .ProseMirror ul,
          .ProseMirror ol {
            margin-left: 24px;
            margin-bottom: 16px;
          }
          .ProseMirror li {
            margin-bottom: 4px;
          }
          .ProseMirror blockquote {
            border-left: 4px solid #f59e0b;
            padding-left: 16px;
            margin: 16px 0;
            background-color: #fef3c7;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
            font-style: italic;
          }
          .ProseMirror table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .ProseMirror table td,
          .ProseMirror table th {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          .ProseMirror table th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          .ProseMirror table tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .ProseMirror img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
