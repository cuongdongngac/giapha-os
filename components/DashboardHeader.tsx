import config from "@/app/config";
import HeaderMenu from "@/components/HeaderMenu";
import Link from "next/link";
import React from "react";

interface DashboardHeaderProps {
  isAdmin: boolean;
  userEmail?: string;
  children?: React.ReactNode;
}

export default function DashboardHeader({
  isAdmin,
  userEmail,
  children,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 border-b border-stone-200 shadow-sm transition-all duration-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="group block">
          <img
            src="/assets/images/banerds.jpg"
            alt="GIA PHẢ HỌ PHẠM ĐÔNG NGẠC"
            className="w-full h-24 object-contain"
          />
        </Link>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-4">{children}</div>
          <div className="flex items-center gap-4">
            <HeaderMenu isAdmin={isAdmin} userEmail={userEmail} />
          </div>
        </div>
      </div>
    </header>
  );
}
