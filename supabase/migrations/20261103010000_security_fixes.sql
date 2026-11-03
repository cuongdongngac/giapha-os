-- ==========================================================================
-- VÁ BẢO MẬT CHO DB ĐANG CHẠY (2026-11-03)
-- Chạy SAU khi đã chạy 20261103000000_gallery.sql.
-- Không xoá / sửa dữ liệu — chỉ thay hàm kiểm quyền, policy RLS và policy Storage.
-- Chạy lại nhiều lần vẫn an toàn.
--
-- Thay đổi chính:
--   1. Storage 'posts' và 'avatars': trước đây MỌI tài khoản đăng nhập đều xoá/ghi đè được
--      file -> nay chỉ Admin/Editor.
--   2. Thông tin liên hệ riêng tư (person_details_private): chỉ Admin (trước đây Editor cũng đọc được,
--      vì is_admin() tính cả Editor).
--   3. activity_logs: bật RLS — chỉ Admin đọc; mỗi người chỉ ghi log của chính mình.
--   4. config (có mật khẩu khách): bật RLS — chỉ Admin.
--   5. is_admin() giữ nguyên ý nghĩa (Admin hoặc Editor) nhưng bỏ qua tài khoản đã bị khoá.
--   6. Thêm is_admin_only(), is_editor(); đặt policy rõ ràng cho branches, person_biography, posts.
--   7. Sửa trigger handle_new_user: bản trong schemanew.sql thiếu ép kiểu enum nên
--      tạo tài khoản mới (kể cả Admin "Thêm người dùng") bị lỗi "Database error saving new user".
-- ==========================================================================

-- ==========================================================================
-- HÀM KIỂM QUYỀN (SECURITY DEFINER để không đệ quy RLS trên profiles)
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active AND role IN ('admin', 'editor')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_only()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active AND role = 'editor');
$$;

CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_active);
$$;

-- Dùng riêng cho Thư viện ảnh (giữ tên để khớp migration gallery)
CREATE OR REPLACE FUNCTION public.can_edit_gallery()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_gallery_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_only();
$$;

REVOKE ALL ON FUNCTION public.is_editor() FROM public;
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;

-- ==========================================================================
-- RLS POLICIES
-- ==========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_details_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_biography ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());

-- PERSONS: ai cũng xem; Admin/Editor sửa
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.persons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.persons;
CREATE POLICY "Enable read access for all users" ON public.persons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can insert persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can update persons" ON public.persons;
DROP POLICY IF EXISTS "Admins can delete persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can insert persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can update persons" ON public.persons;
DROP POLICY IF EXISTS "Admins and Editors can delete persons" ON public.persons;
CREATE POLICY "Admins and Editors can insert persons" ON public.persons FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins and Editors can update persons" ON public.persons FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins and Editors can delete persons" ON public.persons FOR DELETE TO authenticated USING (public.is_admin());

-- PERSON_DETAILS_PRIVATE: chỉ Admin
DROP POLICY IF EXISTS "Admins can view private details" ON public.person_details_private;
DROP POLICY IF EXISTS "Admins can manage private details" ON public.person_details_private;
CREATE POLICY "Admins can view private details" ON public.person_details_private FOR SELECT TO authenticated USING (public.is_admin_only());
CREATE POLICY "Admins can manage private details" ON public.person_details_private FOR ALL TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

-- RELATIONSHIPS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.relationships;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.relationships;
CREATE POLICY "Enable read access for all users" ON public.relationships FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can insert relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can update relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins can delete relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can insert relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can update relationships" ON public.relationships;
DROP POLICY IF EXISTS "Admins and Editors can delete relationships" ON public.relationships;
CREATE POLICY "Admins and Editors can insert relationships" ON public.relationships FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins and Editors can update relationships" ON public.relationships FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins and Editors can delete relationships" ON public.relationships FOR DELETE TO authenticated USING (public.is_admin());

-- PERSON_BIOGRAPHY
DROP POLICY IF EXISTS "Biography public read" ON public.person_biography;
CREATE POLICY "Biography public read" ON public.person_biography FOR SELECT USING (true);
DROP POLICY IF EXISTS "Biography managers write" ON public.person_biography;
CREATE POLICY "Biography managers write" ON public.person_biography FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CUSTOM_EVENTS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.custom_events;
CREATE POLICY "Enable read access for all users" ON public.custom_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert custom events" ON public.custom_events;
CREATE POLICY "Authenticated users can insert custom events" ON public.custom_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "Users can update own custom events" ON public.custom_events;
CREATE POLICY "Users can update own custom events" ON public.custom_events FOR UPDATE TO authenticated USING (auth.uid() = created_by OR public.is_admin());
DROP POLICY IF EXISTS "Users can delete own custom events" ON public.custom_events;
CREATE POLICY "Users can delete own custom events" ON public.custom_events FOR DELETE TO authenticated USING (auth.uid() = created_by OR public.is_admin());

-- BRANCHES
DROP POLICY IF EXISTS "Branches public read" ON public.branches;
CREATE POLICY "Branches public read" ON public.branches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Branches managers write" ON public.branches;
CREATE POLICY "Branches managers write" ON public.branches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- BRANCH_EDITORS
DROP POLICY IF EXISTS "Branch editors read" ON public.branch_editors;
CREATE POLICY "Branch editors read" ON public.branch_editors FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Branch editors admin write" ON public.branch_editors;
CREATE POLICY "Branch editors admin write" ON public.branch_editors FOR ALL TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

-- ACTIVITY_LOGS: ai đăng nhập cũng ghi được log của chính mình; chỉ Admin đọc
DROP POLICY IF EXISTS "Logs insert own" ON public.activity_logs;
CREATE POLICY "Logs insert own" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Logs admin read" ON public.activity_logs;
CREATE POLICY "Logs admin read" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin_only());

-- CONFIG: có mật khẩu khách -> chỉ Admin
DROP POLICY IF EXISTS "Config admin only" ON public.config;
CREATE POLICY "Config admin only" ON public.config FOR ALL TO authenticated USING (public.is_admin_only()) WITH CHECK (public.is_admin_only());

-- POSTS
DROP POLICY IF EXISTS "Public Read Access" ON public.posts;
CREATE POLICY "Public Read Access" ON public.posts FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Admin All Access" ON public.posts;
CREATE POLICY "Admin All Access" ON public.posts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- GALLERY_ITEMS
DROP POLICY IF EXISTS "gallery_select" ON public.gallery_items;
CREATE POLICY "gallery_select" ON public.gallery_items FOR SELECT USING (is_public OR public.is_active_member());
DROP POLICY IF EXISTS "gallery_insert" ON public.gallery_items;
CREATE POLICY "gallery_insert" ON public.gallery_items FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_gallery() AND created_by = auth.uid());
DROP POLICY IF EXISTS "gallery_update" ON public.gallery_items;
CREATE POLICY "gallery_update" ON public.gallery_items FOR UPDATE TO authenticated
  USING (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()))
  WITH CHECK (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()));
DROP POLICY IF EXISTS "gallery_delete" ON public.gallery_items;
CREATE POLICY "gallery_delete" ON public.gallery_items FOR DELETE TO authenticated
  USING (public.is_gallery_admin() OR (created_by = auth.uid() AND public.can_edit_gallery()));

-- ==========================================================================
-- STORAGE
-- ==========================================================================

-- avatars: ai cũng xem; Admin/Editor tải lên, sửa, xoá
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
CREATE POLICY "Users can upload avatars." ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND public.is_admin());
DROP POLICY IF EXISTS "Users can update avatars." ON storage.objects;
CREATE POLICY "Users can update avatars." ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND public.is_admin());
DROP POLICY IF EXISTS "Users can delete avatars." ON storage.objects;
CREATE POLICY "Users can delete avatars." ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND public.is_admin());

-- posts: ai cũng xem; Admin/Editor tải lên, sửa, xoá
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete/Update" ON storage.objects;
DROP POLICY IF EXISTS "posts_storage_read" ON storage.objects;
CREATE POLICY "posts_storage_read" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
DROP POLICY IF EXISTS "posts_storage_insert" ON storage.objects;
CREATE POLICY "posts_storage_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'posts' AND public.is_admin());
DROP POLICY IF EXISTS "posts_storage_update" ON storage.objects;
CREATE POLICY "posts_storage_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'posts' AND public.is_admin());
DROP POLICY IF EXISTS "posts_storage_delete" ON storage.objects;
CREATE POLICY "posts_storage_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'posts' AND public.is_admin());

-- gallery: ai cũng xem; Admin/Editor tải lên; người đăng hoặc Admin xoá
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "gallery_storage_read" ON storage.objects;
CREATE POLICY "gallery_storage_read" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
DROP POLICY IF EXISTS "gallery_storage_insert" ON storage.objects;
CREATE POLICY "gallery_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.can_edit_gallery());
DROP POLICY IF EXISTS "gallery_storage_update" ON storage.objects;
CREATE POLICY "gallery_storage_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.is_gallery_admin()));
DROP POLICY IF EXISTS "gallery_storage_delete" ON storage.objects;
CREATE POLICY "gallery_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.is_gallery_admin()));

-- Ghi nhật ký (dùng từ phía server)
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_action VARCHAR(50),
  p_entity_type VARCHAR(50),
  p_entity_id UUID DEFAULT NULL,
  p_details TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, to_jsonb(p_details));
END;
$$;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity(UUID, VARCHAR, VARCHAR, UUID, TEXT) TO authenticated;


-- ==========================================================================
-- TRIGGER TẠO PROFILE
-- ==========================================================================
-- Tạo profile khi có tài khoản mới (người đầu tiên là Admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  is_first_user boolean;
BEGIN
  SELECT count(*) = 1 FROM auth.users INTO is_first_user;

  INSERT INTO public.profiles (id, role, is_active)
  VALUES (
    new.id,
    CASE WHEN is_first_user THEN 'admin'::public.user_role_enum ELSE 'member'::public.user_role_enum END,
    true
  );

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================================================
-- KIỂM TRA SAU KHI CHẠY: liệt kê toàn bộ policy.
-- Nếu thấy policy lạ (không có trong file này) cho phép quá rộng, ví dụ
-- USING (true) cho INSERT/UPDATE/DELETE, hãy DROP POLICY nó — vì các policy
-- được cộng dồn (OR), một policy lỏng sẽ vô hiệu hoá các policy chặt ở trên.
-- ==========================================================================
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, cmd, policyname;
