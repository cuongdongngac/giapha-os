-- ==========================================
-- EXTENSIONS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- ENUMS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE public.gender_enum AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.relationship_type_enum AS ENUM ('marriage', 'biological_child', 'adopted_child');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role_enum AS ENUM ('admin', 'editor', 'member');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SEQUENCE
-- ==========================================
CREATE SEQUENCE IF NOT EXISTS branches_id_seq;

-- ==========================================
-- TABLES
-- ==========================================

-- USERS PROFILE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role_enum NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- BRANCHES
CREATE TABLE IF NOT EXISTS public.branches (
  id bigint PRIMARY KEY DEFAULT nextval('branches_id_seq'),
  name varchar NOT NULL,
  code varchar,
  parent_id bigint,
  description text,
  created_at timestamptz DEFAULT now(),
  founder varchar,
  church varchar,
  CONSTRAINT fk_branch_parent
    FOREIGN KEY (parent_id) REFERENCES public.branches(id)
    ON DELETE SET NULL
);

-- PERSONS
CREATE TABLE IF NOT EXISTS public.persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  gender public.gender_enum NOT NULL,

  birth_year int,
  birth_month int,
  birth_day int,
  death_year int,
  death_month int,
  death_day int,

  is_deceased boolean DEFAULT false,
  is_in_law boolean DEFAULT false,
  birth_order int,
  generation int,
  other_names text,
  avatar_url text,
  note text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  branch_id bigint,
  is_notable boolean,

  CONSTRAINT fk_person_branch
    FOREIGN KEY (branch_id)
    REFERENCES public.branches(id)
    ON DELETE SET NULL
);

-- PERSON BIOGRAPHY
CREATE TABLE IF NOT EXISTS public.person_biography (
  person_id uuid PRIMARY KEY,
  biography_html text NOT NULL,
  audio_url varchar,
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT fk_person_bio
    FOREIGN KEY (person_id)
    REFERENCES public.persons(id)
    ON DELETE CASCADE
);

-- PRIVATE DETAILS
CREATE TABLE IF NOT EXISTS public.person_details_private (
  person_id uuid PRIMARY KEY,
  phone_number text,
  occupation text,
  current_residence text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT fk_person_private
    FOREIGN KEY (person_id)
    REFERENCES public.persons(id)
    ON DELETE CASCADE
);

-- RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.relationship_type_enum NOT NULL,
  person_a uuid NOT NULL,
  person_b uuid NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT fk_rel_a
    FOREIGN KEY (person_a)
    REFERENCES public.persons(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_rel_b
    FOREIGN KEY (person_b)
    REFERENCES public.persons(id)
    ON DELETE CASCADE,

  CONSTRAINT no_self_relationship CHECK (person_a <> person_b),
  CONSTRAINT unique_relationship UNIQUE(person_a, person_b, type)
);

-- CUSTOM EVENTS
CREATE TABLE IF NOT EXISTS public.custom_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text,
  event_date date NOT NULL,
  location text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action varchar NOT NULL,
  entity_type varchar NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- INDEXES (QUAN TRỌNG CHO PERFORMANCE)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_persons_branch ON public.persons(branch_id);
CREATE INDEX IF NOT EXISTS idx_relationships_a ON public.relationships(person_a);
CREATE INDEX IF NOT EXISTS idx_relationships_b ON public.relationships(person_b);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==========================================
-- TRIGGERS updated_at
-- ==========================================
CREATE TRIGGER tr_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER tr_persons_updated_at
BEFORE UPDATE ON public.persons
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER tr_relationships_updated_at
BEFORE UPDATE ON public.relationships
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER tr_person_private_updated_at
BEFORE UPDATE ON public.person_details_private
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER tr_custom_events_updated_at
BEFORE UPDATE ON public.custom_events
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==========================================
-- 🔥 TRIGGER ĐĂNG KÝ USER (QUAN TRỌNG NHẤT)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_first_user boolean;
BEGIN
  SELECT count(*) = 1 FROM auth.users INTO is_first_user;

  INSERT INTO public.profiles (id, role, is_active)
  VALUES (
    NEW.id,
    CASE 
      WHEN is_first_user THEN 'admin'
      ELSE 'member'
    END,
    true
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();