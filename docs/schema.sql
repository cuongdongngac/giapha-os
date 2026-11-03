-- ==========================================================================
-- GIA PHẢ OS — SCHEMA ĐẦY ĐỦ (chạy được)
--
-- Dùng cho CÀI MỚI: trang /setup đọc file này để bạn copy vào
-- Supabase → SQL Editor → Run. Chạy lại nhiều lần vẫn an toàn
-- (IF NOT EXISTS / DROP ... IF EXISTS, không xoá dữ liệu).
--
-- Gộp từ: schema gốc, docs/schemanew.sql, supabase/migrations/*,
-- Thư viện ảnh (gallery) và bản vá bảo mật 2026-11.
-- Ảnh chụp cấu trúc DB thật (chỉ để tham khảo): docs/schema-db-snapshot.sql
--
-- Quy ước quyền:
--   public.is_admin()       = Admin HOẶC Editor đang hoạt động (người quản lý nội dung)
--                              — giữ đúng ý nghĩa đang dùng trên DB thật.
--   public.is_admin_only()  = chỉ Admin đang hoạt động.
--   public.is_editor()      = chỉ Editor (tương thích bản holegiapha).
-- ==========================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ==========================================================================
-- ENUMS
-- ==========================================================================
DO $$ BEGIN
  CREATE TYPE public.gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.relationship_type_enum AS ENUM ('marriage', 'biological_child', 'adopted_child');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM ('admin', 'editor', 'member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================================================
-- UTILITY
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================================
-- TABLES
-- ==========================================================================

-- PROFILES (tài khoản ứng dụng, gắn với auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role public.user_role_enum DEFAULT 'member' NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRANCHES (chi / nhánh họ)
CREATE SEQUENCE IF NOT EXISTS public.branches_id_seq;
CREATE TABLE IF NOT EXISTS public.branches (
  id BIGINT PRIMARY KEY DEFAULT nextval('public.branches_id_seq'),
  name VARCHAR NOT NULL,
  code VARCHAR,
  parent_id BIGINT REFERENCES public.branches(id) ON DELETE SET NULL,
  description TEXT,
  founder VARCHAR,
  church VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER SEQUENCE public.branches_id_seq OWNED BY public.branches.id;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS founder VARCHAR;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS church VARCHAR;

-- PERSONS (thành viên gia phả)
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender public.gender_enum NOT NULL,
  birth_year INT,
  birth_month INT,
  birth_day INT,
  death_year INT,
  death_month INT,
  death_day INT,
  is_deceased BOOLEAN NOT NULL DEFAULT FALSE,
  is_in_law BOOLEAN NOT NULL DEFAULT FALSE,
  birth_order INT,
  generation INT,
  other_names TEXT,
  avatar_url TEXT,
  note TEXT,
  branch_id BIGINT REFERENCES public.branches(id) ON DELETE SET NULL,
  is_notable BOOLEAN,
  tomb_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Nâng cấp DB cũ: thêm các cột mới nếu chưa có
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS is_notable BOOLEAN;
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS tomb_info TEXT;

-- PERSON_DETAILS_PRIVATE (thông tin liên hệ — chỉ Admin)
CREATE TABLE IF NOT EXISTS public.person_details_private (
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE PRIMARY KEY,
  phone_number TEXT,
  occupation TEXT,
  current_residence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.relationship_type_enum NOT NULL,
  person_a UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  person_b UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_relationship CHECK (person_a != person_b),
  UNIQUE (person_a, person_b, type)
);

-- PERSON_BIOGRAPHY (tiểu sử)
CREATE TABLE IF NOT EXISTS public.person_biography (
  person_id UUID PRIMARY KEY REFERENCES public.persons(id) ON DELETE CASCADE,
  biography_html TEXT NOT NULL,
  audio_url VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.person_biography ADD COLUMN IF NOT EXISTS audio_url VARCHAR;

-- CUSTOM_EVENTS (sự kiện tuỳ chỉnh)
CREATE TABLE IF NOT EXISTS public.custom_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT,
  event_date DATE NOT NULL,
  location TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRANCH_EDITORS (phân quyền biên tập theo chi — dự phòng)
CREATE TABLE IF NOT EXISTS public.branch_editors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  branch_id BIGINT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY_LOGS (nhật ký hoạt động)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONFIG (cấu hình chung)
CREATE TABLE IF NOT EXISTS public.config (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  introduction TEXT,
  guestemail VARCHAR,
  guestpass VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- POSTS (bài viết, tài liệu)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  pdfurl TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS pdfurl TEXT;

-- GALLERY_ITEMS (thư viện ảnh)
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT NOT NULL,
  storage_path  TEXT,
  width         INTEGER,
  height        INTEGER,
  album         TEXT,
  event_date    DATE,
  branch_id     BIGINT REFERENCES public.branches(id) ON DELETE SET NULL,
  person_ids    UUID[] NOT NULL DEFAULT '{}',
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- INDEXES
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_relationships_person_a ON public.relationships(person_a);
CREATE INDEX IF NOT EXISTS idx_relationships_person_b ON public.relationships(person_b);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON public.relationships(type);

CREATE INDEX IF NOT EXISTS idx_persons_full_name ON public.persons(full_name);
CREATE INDEX IF NOT EXISTS idx_persons_generation ON public.persons(generation);
CREATE INDEX IF NOT EXISTS idx_persons_gender ON public.persons(gender);
CREATE INDEX IF NOT EXISTS idx_persons_is_deceased ON public.persons(is_deceased);
CREATE INDEX IF NOT EXISTS idx_persons_birth_year ON public.persons(birth_year);
CREATE INDEX IF NOT EXISTS idx_persons_branch ON public.persons(branch_id);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_custom_events_date ON public.custom_events(event_date);
CREATE INDEX IF NOT EXISTS idx_custom_events_created_by ON public.custom_events(created_by);

CREATE INDEX IF NOT EXISTS idx_branches_parent ON public.branches(parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_status_published ON public.posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_admin_sort ON public.posts(status DESC NULLS LAST, updated_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS gallery_items_event_date_idx ON public.gallery_items (event_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS gallery_items_album_idx ON public.gallery_items (album);
CREATE INDEX IF NOT EXISTS gallery_items_person_ids_idx ON public.gallery_items USING gin (person_ids);

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
-- TRIGGERS
-- ==========================================================================
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_persons_updated_at ON public.persons;
CREATE TRIGGER tr_persons_updated_at BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_person_details_private_updated_at ON public.person_details_private;
DROP TRIGGER IF EXISTS tr_person_private_updated_at ON public.person_details_private;
CREATE TRIGGER tr_person_details_private_updated_at BEFORE UPDATE ON public.person_details_private FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_relationships_updated_at ON public.relationships;
CREATE TRIGGER tr_relationships_updated_at BEFORE UPDATE ON public.relationships FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_custom_events_updated_at ON public.custom_events;
CREATE TRIGGER tr_custom_events_updated_at BEFORE UPDATE ON public.custom_events FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_posts_updated_at ON public.posts;
CREATE TRIGGER tr_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
DROP TRIGGER IF EXISTS gallery_items_updated_at ON public.gallery_items;
DROP TRIGGER IF EXISTS tr_gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER tr_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

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

-- Tự xác nhận email cho tài khoản đầu tiên
CREATE OR REPLACE FUNCTION public.handle_first_user_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users) THEN
    NEW.email_confirmed_at := NOW();
    NEW.last_sign_in_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_first_user_confirmation();

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

-- ==========================================================================
-- RPC FUNCTIONS
-- ==========================================================================

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

-- Lấy cây con cháu (kèm vợ/chồng) từ một người gốc
CREATE OR REPLACE FUNCTION public.get_family_tree_recursive(root_person_id UUID)
RETURNS TABLE (result_persons JSONB, result_relationships JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  descendant_ids UUID[];
  all_member_ids UUID[];
BEGIN
  WITH RECURSIVE descendants AS (
    SELECT id FROM public.persons WHERE id = root_person_id
    UNION
    SELECT p.id
    FROM public.persons p
    JOIN public.relationships r ON r.person_b = p.id
    JOIN descendants d ON r.person_a = d.id
    WHERE r.type IN ('biological_child', 'adopted_child')
  )
  SELECT ARRAY_AGG(id) INTO descendant_ids FROM descendants;

  WITH spouses AS (
    SELECT CASE WHEN person_a = ANY(descendant_ids) THEN person_b ELSE person_a END AS spouse_id
    FROM public.relationships
    WHERE type = 'marriage'
      AND (person_a = ANY(descendant_ids) OR person_b = ANY(descendant_ids))
  )
  SELECT ARRAY_AGG(DISTINCT id) INTO all_member_ids
  FROM (
    SELECT unnest(descendant_ids) AS id
    UNION
    SELECT spouse_id AS id FROM spouses
  ) AS combined;

  RETURN QUERY
  SELECT
    (SELECT jsonb_agg(p.*) FROM public.persons p WHERE p.id = ANY(all_member_ids)),
    (SELECT jsonb_agg(r.*) FROM public.relationships r
      WHERE r.person_a = ANY(all_member_ids) AND r.person_b = ANY(all_member_ids));
END;
$$;

-- Kiểu dữ liệu cho danh sách tài khoản
DROP TYPE IF EXISTS public.admin_user_data CASCADE;
CREATE TYPE public.admin_user_data AS (
  id uuid,
  email text,
  role public.user_role_enum,
  created_at timestamptz,
  is_active boolean
);

-- 1. Danh sách tài khoản (Admin)
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS SETOF public.admin_user_data
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text, p.role, au.created_at, p.is_active
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  ORDER BY au.created_at DESC;
END;
$$;

-- 2. Đổi quyền
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  UPDATE public.profiles SET role = new_role::public.user_role_enum WHERE id = target_user_id;
END;
$$;

-- 3. Xoá tài khoản
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'Cannot delete yourself.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- 4. Admin tạo tài khoản
-- Các cột token/chuỗi PHẢI là '' (không được NULL) — Supabase Auth sẽ lỗi nếu NULL.
CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_email text,
  new_password text,
  new_role text,
  new_active boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  new_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
    reauthentication_token, email_change, phone_change, phone_change_token,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    new_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    new_email, extensions.crypt(new_password, extensions.gen_salt('bf')),
    now(),
    '', '', '', '', '', '', '', '',
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

  INSERT INTO public.profiles (id, role, is_active, created_at, updated_at)
  VALUES (new_id, new_role::public.user_role_enum, new_active, now(), now())
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;

  RETURN new_id;
END;
$function$;

-- 5. Duyệt / khoá tài khoản
CREATE OR REPLACE FUNCTION public.set_user_active_status(target_user_id uuid, new_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied.';
  END IF;

  UPDATE public.profiles SET is_active = new_status WHERE id = target_user_id;
END;
$$;
