-- ==========================================================================
-- MODULE THƯ VIỆN ẢNH (GALLERY)
-- Chạy file này trong Supabase → SQL Editor (chạy lại nhiều lần vẫn an toàn).
--
-- Quyền:
--   • Xem   : ảnh "công khai" ai cũng xem được; ảnh "nội bộ" chỉ tài khoản đã duyệt.
--   • Thêm  : admin, editor (tài khoản đang hoạt động).
--   • Sửa/Xoá: admin, hoặc chính người đã đăng ảnh.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  image_url     text NOT NULL,                 -- URL công khai của ảnh
  storage_path  text,                          -- đường dẫn trong bucket 'gallery' (để xoá file)
  width         integer,
  height        integer,
  album         text,                          -- nhóm ảnh, ví dụ: "Giỗ Tổ 2026"
  event_date    date,                          -- ngày diễn ra (dương lịch)
  branch_id     bigint REFERENCES public.branches(id) ON DELETE SET NULL,
  person_ids    uuid[] NOT NULL DEFAULT '{}',  -- thành viên có trong ảnh
  is_public     boolean NOT NULL DEFAULT true, -- false = chỉ người đã đăng nhập mới xem
  created_by    uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_items_event_date_idx ON public.gallery_items (event_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS gallery_items_album_idx      ON public.gallery_items (album);
CREATE INDEX IF NOT EXISTS gallery_items_person_ids_idx ON public.gallery_items USING gin (person_ids);

-- Tự cập nhật updated_at
CREATE OR REPLACE FUNCTION public.gallery_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.gallery_touch_updated_at();

-- Hàm kiểm quyền (SECURITY DEFINER để không bị đệ quy RLS trên profiles)
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_gallery()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active AND role IN ('admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_gallery_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active AND role = 'admin'
  );
$$;

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_select" ON public.gallery_items;
CREATE POLICY "gallery_select" ON public.gallery_items
  FOR SELECT USING (is_public OR public.is_active_member());

DROP POLICY IF EXISTS "gallery_insert" ON public.gallery_items;
CREATE POLICY "gallery_insert" ON public.gallery_items
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_gallery() AND created_by = auth.uid());

DROP POLICY IF EXISTS "gallery_update" ON public.gallery_items;
CREATE POLICY "gallery_update" ON public.gallery_items
  FOR UPDATE TO authenticated
  USING (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()))
  WITH CHECK (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()));

DROP POLICY IF EXISTS "gallery_delete" ON public.gallery_items;
CREATE POLICY "gallery_delete" ON public.gallery_items
  FOR DELETE TO authenticated
  USING (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()));

-- ==========================================================================
-- STORAGE: bucket 'gallery' (public để hiển thị ảnh bằng URL trực tiếp)
-- Giới hạn 10MB/ảnh, chỉ nhận định dạng ảnh.
-- ==========================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "gallery_storage_read" ON storage.objects;
CREATE POLICY "gallery_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_storage_insert" ON storage.objects;
CREATE POLICY "gallery_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.can_edit_gallery());

DROP POLICY IF EXISTS "gallery_storage_update" ON storage.objects;
CREATE POLICY "gallery_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.is_gallery_admin()));

DROP POLICY IF EXISTS "gallery_storage_delete" ON storage.objects;
CREATE POLICY "gallery_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.is_gallery_admin()));
