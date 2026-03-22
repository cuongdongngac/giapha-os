"use client";

import React, { useState } from "react";
import RichTextEditor from "@/components/editor/RichTextEditor";

export default function EditorPage() {
  const [content, setContent] = useState(
    `<h3>Tiểu sử cá nhân</h3>
<p>Đây là nội dung mẫu để thử nghiệm trình soạn thảo.</p>
<p>Bạn có thể chỉnh sửa văn bản, thêm danh sách, bảng biểu...</p>`,
  );

  const handleLogData = () => {
    console.log("HTML Output:", content);
    alert("Đã xuất HTML ra Console (F12)");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 font-sans">
      <h2 className="border-b-2 border-[#2FA4E7] pb-2.5 text-2xl text-[#2FA4E7]">
        Biên tập Tiểu sử Phả hệ
      </h2>

      <div className="mt-8 min-h-[400px]">
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handleLogData}
          className="cursor-pointer rounded border-none bg-[#2FA4E7] px-5 py-2.5 font-bold text-white"
        >
          Lấy mã HTML
        </button>
        <button
          type="button"
          onClick={() => setContent("")}
          className="cursor-pointer rounded border border-gray-300 bg-gray-100 px-5 py-2.5"
        >
          Xóa
        </button>
      </div>

      <div className="mt-10">
        <h4 className="mb-2 text-gray-600">Xem trước (Preview):</h4>
        <div
          className="rendered-html-content min-h-[100px] rounded-lg border border-gray-200 bg-white p-5"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      <style jsx global>{`
        .ProseMirror h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .ProseMirror h2 {
          font-size: 26px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .ProseMirror h3 {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .ProseMirror p {
          margin-bottom: 16px !important;
          line-height: 1.6;
          display: block;
          min-height: 1.6em;
        }

        .ProseMirror .my-paragraph {
          margin-bottom: 16px !important;
          line-height: 1.6;
          display: block;
          min-height: 1.6em;
        }

        .ProseMirror p:not(:last-child) {
          margin-bottom: 16px !important;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          margin-left: 20px;
          margin-bottom: 12px;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #2fa4e7;
          padding-left: 10px;
          color: #666;
          margin: 10px 0;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin-top: 10px;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #ddd;
          padding: 8px;
        }
      `}</style>
    </div>
  );
}
