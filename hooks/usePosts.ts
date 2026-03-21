'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPosts, getPostById, Post } from '@/app/actions/posts';

interface UsePostsOptions {
  page?: number;
  limit?: number;
  status?: string;
  autoLoad?: boolean;
}

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
  getPostDetail: (id: string) => Promise<Post | null>;
  clearCache: () => void;
}

// Global cache for posts data
let postsCache: Map<string, { data: Post[]; count: number; timestamp: number }> = new Map();
let postDetailCache: Map<string, { data: Post; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const { page: initialPage = 1, limit = 10, status = 'published', autoLoad = true } = options;
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(initialPage);

  const cacheKey = `posts_${status}_${page}_${limit}`;

  const loadPosts = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = postsCache.get(cacheKey);
        if (cached && isCacheValid(cached.timestamp)) {
          setPosts(cached.data);
          setTotalCount(cached.count);
          setLoading(false);
          return;
        }
      }

      const { data, count, error: fetchError } = await getPosts(page, limit, status);
      
      if (fetchError) throw new Error(fetchError);

      // Update cache
      postsCache.set(cacheKey, {
        data,
        count,
        timestamp: Date.now()
      });

      setPosts(data);
      setTotalCount(count);
    } catch (err: any) {
      setError(err.message);
      setPosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, cacheKey]);

  const getPostDetail = useCallback(async (id: string): Promise<Post | null> => {
    try {
      // Check cache first
      const cached = postDetailCache.get(id);
      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
      }

      const { data, error } = await getPostById(id);
      
      if (error) throw new Error(error);
      if (!data) return null;

      // Update cache
      postDetailCache.set(id, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (err: any) {
      console.error('Error fetching post detail:', err);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadPosts(true);
  }, [loadPosts]);

  const clearCache = useCallback(() => {
    postsCache.clear();
    postDetailCache.clear();
  }, []);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadPosts();
    }
  }, [loadPosts, autoLoad]);

  return {
    posts,
    loading,
    error,
    totalCount,
    page,
    setPage,
    refresh,
    getPostDetail,
    clearCache
  };
}
