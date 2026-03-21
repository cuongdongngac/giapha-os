import { getPosts } from "@/app/actions/posts";
import PostCard from "./PostCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function FeaturedPosts() {
  const { data: posts } = await getPosts(1, 3);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
            Bài viết mới nhất
          </h2>
          <p className="text-stone-500 mt-2 max-w-2xl text-lg">
            Khám phá những câu chuyện, kỷ niệm và thông báo mới nhất từ dòng họ.
          </p>
        </div>
        <Link 
          href="/dashboard?view=posts" 
          className="group inline-flex items-center gap-2 text-stone-900 font-bold hover:text-amber-700 transition-colors"
        >
          Xem tất cả bài viết
          <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} layout="grid" />
        ))}
      </div>
    </section>
  );
}
