-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'member'::user_role_enum,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.persons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  gender USER-DEFINED NOT NULL,
  birth_year integer,
  birth_month integer,
  birth_day integer,
  death_year integer,
  death_month integer,
  death_day integer,
  is_deceased boolean NOT NULL DEFAULT false,
  is_in_law boolean NOT NULL DEFAULT false,
  birth_order integer,
  generation integer,
  other_names text,
  avatar_url text,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  branch_id bigint,
  is_notable boolean,
  tomb_info text,
  CONSTRAINT persons_pkey PRIMARY KEY (id),
  CONSTRAINT fk_person_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.person_details_private (
  person_id uuid NOT NULL,
  phone_number text,
  occupation text,
  current_residence text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT person_details_private_pkey PRIMARY KEY (person_id),
  CONSTRAINT person_details_private_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.relationships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type USER-DEFINED NOT NULL,
  person_a uuid NOT NULL,
  person_b uuid NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT relationships_pkey PRIMARY KEY (id),
  CONSTRAINT relationships_person_a_fkey FOREIGN KEY (person_a) REFERENCES public.persons(id),
  CONSTRAINT relationships_person_b_fkey FOREIGN KEY (person_b) REFERENCES public.persons(id)
);
CREATE TABLE public.custom_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text,
  event_date date NOT NULL,
  location text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_events_pkey PRIMARY KEY (id),
  CONSTRAINT custom_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.branches (
  id bigint NOT NULL DEFAULT nextval('branches_id_seq'::regclass),
  name character varying NOT NULL,
  code character varying,
  parent_id bigint,
  description text,
  created_at timestamp without time zone DEFAULT now(),
  founder character varying,
  church character varying,
  CONSTRAINT branches_pkey PRIMARY KEY (id),
  CONSTRAINT branches_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.branches(id)
);
CREATE TABLE public.person_biography (
  person_id uuid NOT NULL,
  biography_html text NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  audio_url character varying,
  CONSTRAINT person_biography_pkey PRIMARY KEY (person_id),
  CONSTRAINT fk_person_bio FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.branch_editors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  branch_id bigint NOT NULL,
  role text DEFAULT 'editor'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT branch_editors_pkey PRIMARY KEY (id),
  CONSTRAINT branch_editors_user_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT branch_editors_branch_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying NOT NULL,
  entity_type character varying NOT NULL,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.config (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  introduction text,
  guestemail character varying,
  guestpass character varying,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  excerpt text,
  featured_image text,
  author_id uuid,
  status text DEFAULT 'published'::text,
  published_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  pdfurl text,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.gallery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  storage_path text,
  width integer,
  height integer,
  album text,
  event_date date,
  branch_id bigint,
  person_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gallery_items_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_items_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id),
  CONSTRAINT gallery_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
