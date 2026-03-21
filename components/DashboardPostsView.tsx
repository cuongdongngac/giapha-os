"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "./DashboardContext";
import { getPosts, getPostById, Post, deletePost } from "@/app/actions/posts";
import PostCard from "./PostCard";
import PostForm from "./PostForm";
import { 
  FileText, 
  Plus, 
  ArrowLeft, 
  Calendar, 
  User, 
  ChevronLeft, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardPostsViewProps {
  isAdmin?: boolean;
}

export default function DashboardPostsView({ isAdmin }: DashboardPostsViewProps) {
  const { 
    selectedPostId, setSelectedPostId,
    isCreatingPost, setIsCreatingPost,
    editingPostId, setEditingPostId
  } = useDashboard();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data, count, error: fetchError } = await getPosts(page, limit, isAdmin ? 'all' : 'published');
      if (fetchError) throw new Error(fetchError);
      setPosts(data);
      setTotalCount(count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page, isAdmin]);

  // Load selected post detail if needed
  useEffect(() => {
    if (selectedPostId) {
      const fetchDetail = async () => {
        const { data, error: detailError } = await getPostById(selectedPostId);
        if (data) setSelectedPost(data);
      };
      fetchDetail();
    } else {
      setSelectedPost(null);
    }
  }, [selectedPostId]);

  // Load editing post if needed
  useEffect(() => {
    if (editingPostId) {
      const fetchEditDetail = async () => {
        const { data, error: editError } = await getPostById(editingPostId);
        if (data) setEditingPost(data);
      };
      fetchEditDetail();
    } else {
      setEditingPost(null);
    }
  }, [editingPostId]);

  const handleBack = () => {
    setSelectedPostId(null);
    setIsCreatingPost(false);
    setEditingPostId(null);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 text-amber-600 animate-spin" />
        <p className="text-stone-500 font-medium">Đang tải bài viết...</p>
      </div>
    );
  }

  // CREATE VIEW
  if (isCreatingPost) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 w-full">
        <PostForm onSuccess={() => { handleBack(); loadPosts(); }} onCancel={handleBack} />
      </div>
    );
  }

  // EDIT VIEW
  if (editingPostId) {
    if (!editingPost) return (
      <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-amber-600" /></div>
    );
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 w-full">
        <PostForm initialData={editingPost} isEditing={true} onSuccess={() => { handleBack(); loadPosts(); }} onCancel={handleBack} />
      </div>
    );
  }

  // DETAIL VIEW
  if (selectedPost) {
    const otherPosts = posts.filter(p => p.id !== selectedPost.id).slice(0, 3);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 w-full">
        <article className="space-y-8 pb-12 border-b border-stone-200">
          <header className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
              {selectedPost.status === 'draft' ? "Bản nháp" : "Tài liệu dòng họ"}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight">
              {selectedPost.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-stone-500 text-sm font-medium">
              <span className="flex items-center gap-2">
                <Calendar className="size-4" />
                {selectedPost.published_at ? new Date(selectedPost.published_at).toLocaleDateString("vi-VN") : "Chưa xuất bản"}
              </span>
              <span className="flex items-center gap-2">
                <User className="size-4" />
                Ban biên tập
              </span>
            </div>
          </header>

          <div 
            className="prose prose-stone prose-amber max-w-none 
              prose-headings:font-serif prose-headings:font-bold 
              prose-p:text-stone-600 prose-p:leading-relaxed prose-p:text-lg
              prose-img:rounded-2xl prose-img:border prose-img:border-stone-200"
            dangerouslySetInnerHTML={{ __html: selectedPost.content || "" }}
          />
        </article>

        {/* RELATED POSTS SECTION */}
        {otherPosts.length > 0 && (
          <div className="mt-16 space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold text-stone-900 border-l-4 border-amber-500 pl-4 py-1">
                Bài viết khác
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherPosts.map((otherPost) => (
                <div 
                  key={otherPost.id}
                  onClick={() => {
                    setSelectedPostId(otherPost.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group cursor-pointer space-y-3"
                >
                  <div className="aspect-video rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    {otherPost.featured_image ? (
                      <img 
                        src={otherPost.featured_image} 
                        alt={otherPost.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <FileText className="size-8" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors line-clamp-2 leading-snug">
                    {otherPost.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                     <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {otherPost.published_at ? new Date(otherPost.published_at).toLocaleDateString("vi-VN") : "Mới"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <FileText className="size-6 text-amber-600" />
            Bài viết & Tài liệu
          </h2>
          <p className="text-stone-500 text-sm mt-1">Các câu chuyện, kỷ niệm và kiến thức dòng họ.</p>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsCreatingPost(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-full font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-95"
          >
            <Plus className="size-4" />
            Tạo bài viết
          </button>
        )}
      </div>

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <PostCard 
              key={post.id} 
              post={post} 
              index={index} 
              isAdmin={isAdmin} 
              layout="list"
              onSelect={() => setSelectedPostId(post.id)}
              onEdit={() => setEditingPostId(post.id)}
            />
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 border-dashed p-12 text-center space-y-3">
             <div className="size-12 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto">
               <FileText className="size-6 text-stone-300" />
             </div>
             <p className="text-stone-500 font-medium">Chưa có bài viết nào được đăng.</p>
          </div>
        )}
      </div>

      {totalCount > limit && (
        <div className="flex items-center justify-center gap-4 pt-8 border-t border-stone-100">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 text-sm font-bold text-stone-500 hover:text-amber-700 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Trang trước
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.ceil(totalCount / limit) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`size-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                  page === p ? 'bg-amber-100 text-amber-800' : 'text-stone-400 hover:bg-stone-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            disabled={page >= Math.ceil(totalCount / limit)}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 text-sm font-bold text-stone-500 hover:text-amber-700 disabled:opacity-30 disabled:hover:text-stone-500 transition-colors"
          >
            Trang sau
            <ArrowLeft className="size-4 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
