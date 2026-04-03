"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  pdfurl: string | null;
}

export async function getPosts(page: number = 1, limit: number = 10, status: string = 'published') {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const offset = (page - 1) * limit;

  // We optimize performance by:
  // 1. Only selecting necessary fields for the list (excluding heavy 'content' column)
  // 2. Using 'estimated' count which is much faster in PostgreSQL for larger tables
  // 3. No RLS overhead - direct table access
  // 4. Adding proper indexes for admin queries
  let query = supabase
    .from("posts")
    .select("id, title, slug, excerpt, featured_image, author_id, status, published_at, created_at, updated_at, pdfurl", { count: "estimated" });

  if (status !== 'all') {
    // Public view: Only published, sorted by published date
    query = query
      .eq("status", status)
      .order("published_at", { ascending: false, nullsFirst: false });
  } else {
    // Admin view: All posts, but prioritize published posts for better UX
    // Sort by status first, then by updated_at for better workflow
    query = query
      .order("status", { ascending: false }) // Published first, then drafts
      .order("updated_at", { ascending: false, nullsFirst: false });
  }

  const startTime = performance.now();
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  const endTime = performance.now();
  
  console.log(`getPosts(${status}, page ${page}) took ${endTime - startTime}ms, returned ${count} posts`);

  if (error) {
    console.error("Error fetching posts:", error);
    return { data: [], count: 0, error: error.message };
  }

  return { data: data as Post[], count: count || 0, error: null };
}

export async function getPostBySlug(slug: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, featured_image, author_id, status, published_at, created_at, updated_at, content, pdfurl") // Explicit fields instead of *
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching post by slug:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Post, error: null };
}

export async function getPostById(id: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const startTime = performance.now();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, featured_image, author_id, status, published_at, created_at, updated_at, content, pdfurl") // Explicit fields instead of *
    .eq("id", id)
    .single();
  const endTime = performance.now();
  
  console.log(`getPostById took ${endTime - startTime}ms`);

  if (error) {
    console.error("Error fetching post by ID:", error);
    return { data: null, error: error.message };
  }

  return { data: data as Post, error: null };
}

export async function createPost(formData: any) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...formData,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating post:", error);
    return { data: null, error: error.message };
  }

  revalidatePath("/posts");
  return { data: data as Post, error: null };
}

export async function updatePost(id: string, formData: any) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("posts")
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating post:", error);
    return { error: error.message };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${formData.slug}`);
  return { error: null };
}

export async function deletePost(id: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting post:", error);
    return { error: error.message };
  }

  revalidatePath("/posts");
  return { error: null };
}
