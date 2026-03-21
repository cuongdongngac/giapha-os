"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, FileText, Home, LogIn } from "lucide-react";

export default function PublicHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Trang chủ", icon: <Home className="size-4" /> },
    { href: "/dashboard?view=posts", label: "Bài viết", icon: <FileText className="size-4" /> },
    { href: "/about", label: "Giới thiệu", icon: <BookOpen className="size-4" /> },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-md border-b border-stone-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <span className="font-serif font-bold text-xl">P</span>
          </div>
          <span className="font-serif font-bold text-xl text-stone-900 hidden sm:block">Phạm tộc</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-amber-50 text-amber-700" 
                    : "text-stone-600 hover:text-amber-700 hover:bg-stone-50"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/10 active:scale-95"
          >
            <LogIn className="size-4" />
            Đăng nhập
          </Link>
        </div>
      </div>
    </header>
  );
}
