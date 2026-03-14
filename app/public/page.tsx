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
import { Person, Relationship } from "@/types";

export default function PublicPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installPromptShown, setInstallPromptShown] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // PWA Install Prompt Handler
  useEffect(() => {
    console.log("🔍 PWA Install Handler initialized");
    console.log(
      "🔍 beforeinstallprompt supported:",
      "beforeinstallprompt" in window,
    );
    console.log("🔍 Service Worker supported:", "serviceWorker" in navigator);
    console.log("🔍 HTTPS:", location.protocol === "https:");
    console.log(
      "🔍 Standalone:",
      window.matchMedia("(display-mode: standalone)").matches,
    );

    const handleBeforeInstallPrompt = (e: any) => {
      console.log("🚀 beforeinstallprompt fired!");
      e.preventDefault();
      setDeferredPrompt(e);

      // Only show if not already shown in this session
      const hasShownPrompt = sessionStorage.getItem("pwa-install-prompt-shown");
      if (!hasShownPrompt && !installPromptShown) {
        setShowInstallPrompt(true);
        setInstallPromptShown(true);
        sessionStorage.setItem("pwa-install-prompt-shown", "true");
        console.log("📱 Install prompt should be visible now");
      } else {
        console.log("📱 Install prompt already shown in this session");
      }
    };

    const handleAppInstalled = () => {
      console.log("✅ App installed successfully!");
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      sessionStorage.removeItem("pwa-install-prompt-shown");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if install prompt is already available
    setTimeout(() => {
      if (!deferredPrompt) {
        console.log("⚠️ No install prompt available after 2 seconds");
        console.log('🔍 Try clicking "🔍 Test Install" button');
      }
    }, 2000);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [installPromptShown]);

  // Auto-hide install prompt after 8 seconds
  useEffect(() => {
    if (showInstallPrompt) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(false);
        console.log("⏰ Install prompt auto-hidden after 8 seconds");
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log("❌ No deferred prompt available");
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      console.log("✅ User accepted the install prompt");
    } else {
      console.log("❌ User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissPrompt = () => {
    setShowInstallPrompt(false);
    console.log("👋 User dismissed install prompt");
  };

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
            <p className="text-stone-600 mb-4">
              Đang đăng nhập tự động với tài khoản guest...
            </p>

            {/* Manual Install Trigger (for testing) */}
            <div className="mb-4">
              <button
                onClick={() => {
                  console.log("🔍 Manual install trigger clicked");
                  if (deferredPrompt) {
                    handleInstallClick();
                  } else {
                    console.log("❌ No deferred prompt available");
                    // Try to trigger install prompt manually
                    const event = new Event("beforeinstallprompt");
                    window.dispatchEvent(event);
                  }
                }}
                className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full hover:bg-amber-200 transition-colors"
              >
                🔍 Test Install
              </button>
            </div>

            {/* PWA Install Prompt */}
            {showInstallPrompt && (
              <div className="fixed bottom-4 left-4 right-4 bg-white border border-amber-200 rounded-xl shadow-lg p-4 max-w-sm mx-auto z-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    ĐN
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900">
                      Họ Phạm Đông Ngạc
                    </h3>
                    <p className="text-sm text-stone-600">
                      Cài đặt ứng dụng gia phả
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
                  >
                    📱 Cài đặt
                  </button>
                  <button
                    onClick={handleDismissPrompt}
                    className="flex-1 bg-stone-200 text-stone-700 px-4 py-2 rounded-lg font-medium hover:bg-stone-300 transition-colors"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}
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
