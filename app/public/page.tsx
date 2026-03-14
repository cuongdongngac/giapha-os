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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const autoLoginAsGuest = async () => {
      try {
        // Check if environment variables are available
        const guestEmail =
          process.env.NEXT_PUBLIC_GUEST_EMAIL || "guest@hophamdongngac.org";
        const guestPass =
          process.env.NEXT_PUBLIC_GUEST_PASS || "hophamdongngac@123";

        console.log("Environment variables check:", {
          email: guestEmail ? "SET" : "MISSING",
          pass: guestPass ? "SET" : "MISSING",
          emailValue: guestEmail ? guestEmail.substring(0, 3) + "..." : "EMPTY",
          rawEmail: process.env.NEXT_PUBLIC_GUEST_EMAIL,
          rawPass: process.env.NEXT_PUBLIC_GUEST_PASS ? "***" : "undefined",
        });

        if (!guestEmail || !guestPass) {
          throw new Error("Guest credentials not configured properly");
        }

        // Try to login as guest with provided credentials
        const { data: authData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: guestEmail,
            password: guestPass,
          });

        if (signInError) {
          console.error("Guest login failed:", signInError);
          setError(
            "Không thể đăng nhập với tài khoản guest: " + signInError.message,
          );
          setLoading(false);
          return;
        }

        console.log("Guest login successful:", authData);

        // Redirect to dashboard after successful login
        router.push("/dashboard?view=list");
      } catch (err) {
        console.error("Auto login error:", err);
        setError("Không thể tải dữ liệu gia phả");
      } finally {
        setLoading(false);
      }
    };

    autoLoginAsGuest();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-stone-600">
              Đang đăng nhập tự động với tài khoản guest...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col selection:bg-amber-200 selection:text-amber-900 relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      </div>
    );
  }

  // This should not render as we redirect on success
  return null;
}
