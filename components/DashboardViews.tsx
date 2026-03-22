"use client";

import { useDashboard } from "@/components/DashboardContext";
import DashboardMemberList from "@/components/DashboardMemberList";
import DashboardMembersBranchGenerationList from "@/components/DashboardMembersBranchGenerationList";
import FamilyTree from "@/components/FamilyTree";
import MindmapTree from "@/components/MindmapTree";
import RootSelector from "@/components/RootSelector";
import BranchesTable from "@/components/BranchesTable";
import Introduction from "@/components/Introduction";
import AudioPlayer from "@/components/AudioPlayer";
import NotablesList from "@/components/NotablesList";
import DashboardPostsView from "@/components/DashboardPostsView";
import DashboardPostsViewStandalone from "@/components/DashboardPostsViewStandalone";
import FamilyDataViews from "@/components/FamilyDataViews";
import { Person, Relationship } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo } from "react";

interface DashboardViewsProps {
  persons: Person[];
  relationships: Relationship[];
  canEdit?: boolean;
  finalRootId?: string;
}

export default function DashboardViews({
  persons,
  relationships,
  canEdit = false,
  finalRootId,
}: DashboardViewsProps) {
  const { view: currentView, rootId, maxDepth, setMaxDepth } = useDashboard();

  return (
    <>
      <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
        {/* Views that need family data - use FamilyDataViews */}
        {(currentView === "tree" ||
          currentView === "mindmap" ||
          currentView === "list" ||
          currentView === "members_filter" ||
          currentView === "notables") && (
          <FamilyDataViews canEdit={canEdit} finalRootId={finalRootId} />
        )}

        {/* Views that don't need family data */}
        {currentView === "branches" && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
            <BranchesTable />
          </div>
        )}

        {currentView === "introduction" && (
          <div className="relative">
            <Introduction />
            <div className="fixed left-4 bottom-6 z-50">
              <AudioPlayer
                title="Giới thiệu làng Kẻ Vẽ"
                src="https://mediaserver.huph.edu.vn/vod/nas1videos/phahe/gioithieudongngac.mp3"
              />
            </div>
          </div>
        )}

        {currentView === "posts" && (
          <div className="max-w-7xl mx-auto py-4 w-full relative z-10">
            <DashboardPostsViewStandalone isAdmin={canEdit} />
          </div>
        )}
      </main>
    </>
  );
}
