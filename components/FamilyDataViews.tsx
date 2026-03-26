"use client";

import { useDashboard } from "./DashboardContext";
import DashboardMemberList from "./DashboardMemberList";
import DashboardMembersBranchGenerationList from "./DashboardMembersBranchGenerationList";
import FamilyTreeClean from "./FamilyTreeClean";
import MindmapTree from "./MindmapTree";
import RootSelector from "./RootSelector";
import NotablesList from "./NotablesList";
import { useFamilyData } from "@/hooks/useFamilyData";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useMemo } from "react";

interface FamilyDataViewsProps {
  canEdit?: boolean;
  finalRootId?: string;
}

export default function FamilyDataViews({
  canEdit = false,
  finalRootId,
}: FamilyDataViewsProps) {
  const { view: currentView, rootId, maxDepth, setMaxDepth } = useDashboard();

  // Load family data dynamically when needed
  const { persons, relationships, loading, error, loadData } = useFamilyData({
    autoLoad: true, // Always load when component mounts
  });

  // Prepare map and roots for tree views
  const { personsMap, roots, defaultRootId } = useMemo(() => {
    if (persons.length === 0) {
      return { personsMap: new Map(), roots: [], defaultRootId: finalRootId };
    }

    const pMap = new Map<string, any>();
    persons.forEach((p) => pMap.set(p.id, p));

    const childIds = new Set(
      relationships
        .filter(
          (r) => r.type === "biological_child" || r.type === "adopted_child",
        )
        .map((r) => r.person_b),
    );

    let calculatedRootId = rootId || finalRootId;

    // Ensure we check for ID existence in a case-insensitive way if needed,
    // although UUIDs should be standard.
    if (calculatedRootId && !pMap.has(calculatedRootId)) {
      // Try to find by lowercase just in case
      const found = Array.from(pMap.keys()).find(
        (id) => id.toLowerCase() === calculatedRootId?.toLowerCase(),
      );
      if (found) {
        calculatedRootId = found;
      }
    }

    // If no rootId is provided, fallback to the earliest created person
    if (!calculatedRootId || !pMap.has(calculatedRootId)) {
      const rootsFallback = persons.filter((p) => !childIds.has(p.id));
      if (rootsFallback.length > 0) {
        calculatedRootId = rootsFallback[0].id;
      } else if (persons.length > 0) {
        calculatedRootId = persons[0].id;
      }
    }

    let calculatedRoots: any[] = [];
    if (calculatedRootId && pMap.has(calculatedRootId)) {
      calculatedRoots = [pMap.get(calculatedRootId)!];
    }

    return {
      personsMap: pMap,
      roots: calculatedRoots,
      defaultRootId: calculatedRootId,
    };
  }, [persons, relationships, rootId, finalRootId]);

  const activeRootId = rootId || defaultRootId;

  // Show loading state
  if (loading && persons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 text-amber-600 animate-spin" />
        <p className="text-stone-500 font-medium">
          Đang tải dữ liệu gia phả...
        </p>
      </div>
    );
  }

  // Show error state
  if (error && persons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
          <p className="text-red-800 text-center">Lỗi tải dữ liệu: {error}</p>
          <button
            onClick={loadData}
            className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-stone-50/50 flex flex-col">
      {(currentView === "tree" || currentView === "mindmap") &&
        persons.length > 0 &&
        activeRootId && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full flex flex-col sm:flex-row flex-wrap items-center sm:justify-between gap-4 relative z-20">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <RootSelector persons={persons} currentRootId={activeRootId} />
              <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md pl-3 pr-1.5 py-1 rounded-full border border-stone-200/60 shadow-sm h-10 transition-all hover:border-amber-200 hover:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400">
                <span className="text-sm font-medium text-stone-500 hidden sm:inline whitespace-nowrap">
                  Độ sâu hiển thị:
                </span>
                <span className="text-sm font-medium text-stone-500 sm:hidden whitespace-nowrap">
                  Độ sâu:
                </span>
                <div className="flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={maxDepth}
                    onChange={(e) =>
                      setMaxDepth(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-8 text-center text-sm font-bold text-amber-700 bg-transparent border-none p-0 focus:ring-0 m-0 focus:outline-none placeholder:text-stone-300"
                    style={{ MozAppearance: "textfield" }}
                  />
                  <div className="flex flex-col ml-0.5">
                    <button
                      onClick={() => setMaxDepth(Math.min(99, maxDepth + 1))}
                      className="text-stone-400 hover:text-amber-600 focus:outline-none p-0.5 rounded hover:bg-stone-100/50 transition-colors"
                      title="Tăng độ sâu"
                    >
                      <ChevronUp className="size-3" strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => setMaxDepth(Math.max(1, maxDepth - 1))}
                      className="text-stone-400 hover:text-amber-600 focus:outline-none p-0.5 rounded hover:bg-stone-100/50 transition-colors"
                      title="Giảm độ sâu"
                    >
                      <ChevronDown className="size-3" strokeWidth={3} />
                    </button>
                  </div>
                </div>
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  input[type=number]::-webkit-inner-spin-button, 
                  input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                  }
                `,
                  }}
                />
              </div>
            </div>
            <div
              id="tree-toolbar-portal"
              className="flex items-center gap-2 flex-wrap justify-center w-full sm:w-auto"
            />
          </div>
        )}

      {currentView === "list" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
          <DashboardMemberList
            initialPersons={persons}
            canEdit={canEdit}
            totalCount={persons.length}
          />
        </div>
      )}

      {currentView === "members_filter" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full relative z-10">
          <DashboardMembersBranchGenerationList persons={persons} />
        </div>
      )}

      {currentView === "notables" && <NotablesList persons={persons} />}

      <div className="flex-1 w-full relative z-10">
        {currentView === "tree" && (
          <FamilyTreeClean
            key={`tree-${activeRootId}`}
            personsMap={personsMap}
            relationships={relationships}
            roots={roots}
            canEdit={canEdit}
          />
        )}
        {currentView === "mindmap" && (
          <MindmapTree
            key={`mindmap-${activeRootId}`}
            personsMap={personsMap}
            relationships={relationships}
            roots={roots}
            canEdit={canEdit}
          />
        )}
      </div>
    </main>
  );
}
