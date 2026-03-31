"use client";

import Footer from "@/components/Footer";
import { createClient } from "@/utils/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Info, Users, Eye, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DashboardViews from "@/components/DashboardViews";
import ViewToggle from "@/components/ViewToggle";

export default function PublicPage() {
  useEffect(() => {
    // Redirect directly to dashboard list view
    // This fulfills the requirement of viewing without needing a guest login
    window.location.href = "/dashboard?view=list";
  }, []);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-stone-600">
            Đang chuyển hướng đến trang xem gia phả...
          </p>
        </div>
      </div>
    </div>
  );
}
