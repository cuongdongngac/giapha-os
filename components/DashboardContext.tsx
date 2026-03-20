"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { ViewMode } from "./ViewToggle";

interface DashboardState {
  memberModalId: string | null;
  setMemberModalId: (id: string | null) => void;
  showAvatar: boolean;
  setShowAvatar: (show: boolean) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
  rootId: string | null;
  setRootId: (id: string | null) => void;
  maxDepth: number;
  setMaxDepth: (depth: number) => void;
}

export const DashboardContext = createContext<DashboardState | undefined>(
  undefined,
);

export function DashboardProvider({
  children,
  initialRootId,
}: {
  children: React.ReactNode;
  initialRootId?: string;
}) {
  const searchParams = useSearchParams();
  const [memberModalId, setMemberModalId] = useState<string | null>(null);
  const [showAvatar, setShowAvatar] = useState<boolean>(true);
  const [view, setViewState] = useState<ViewMode>("list");
  const [rootId, setRootIdState] = useState<string | null>(null);
  const [maxDepth, setMaxDepthState] = useState<number>(3);

  // Store initialRootId in a ref to use it in setView
  const envRootIdRef = useRef(initialRootId);
  useEffect(() => {
    envRootIdRef.current = initialRootId;
  }, [initialRootId]);

  // Keep state in sync with URL query params (so deep-links can switch tabs)
  useEffect(() => {
    const avatarParam = searchParams.get("avatar");
    setShowAvatar(avatarParam !== "hide");

    const viewParam = searchParams.get("view") as ViewMode;
    if (viewParam && viewParam !== view) setViewState(viewParam);

    // Prioritize environment root ID, then URL parameter
    const rootIdParam = searchParams.get("rootId");
    const effectiveRootId = rootIdParam || initialRootId || null;
    if (effectiveRootId !== rootId) setRootIdState(effectiveRootId);

    const maxDepthParam = searchParams.get("maxDepth");
    if (maxDepthParam) setMaxDepthState(parseInt(maxDepthParam, 10));

    // We intentionally ignore memberModalId in the Next.js router loop
    // to avoid Next.js triggering re-renders on push.
    // If the URL has it on first load, we grab it from window.location instead
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const modalId = sp.get("memberModalId");
      if (modalId && !memberModalId) {
        setMemberModalId(modalId);
      }
    }
  }, [searchParams, memberModalId, rootId, view, initialRootId]);

  // Sync to URL silently
  const updateModalId = (id: string | null) => {
    setMemberModalId(id);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      if (id) {
        newUrl.searchParams.set("memberModalId", id);
      } else {
        newUrl.searchParams.delete("memberModalId");
      }
      window.history.replaceState(null, "", newUrl.toString());
    }
  };

  const updateAvatar = (show: boolean) => {
    setShowAvatar(show);
  };

  const setView = (v: ViewMode) => {
    setViewState(v);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("view", v);

      // Always include maxDepth and rootId when switching to tree/mindmap views
      if (v === "tree" || v === "mindmap") {
        // For mindmap, prioritize current URL rootId, fallback to environment
        if (v === "mindmap") {
          const currentRootId = newUrl.searchParams.get("rootId");
          const envRootId = envRootIdRef.current;

          if (currentRootId) {
            // Use existing rootId from URL
            newUrl.searchParams.set("rootId", currentRootId);
          } else if (envRootId) {
            // Fallback to environment variable
            newUrl.searchParams.set("rootId", envRootId);
          }
        } else {
          // For tree, use environment variable
          const envRootId = envRootIdRef.current;
          if (envRootId) {
            newUrl.searchParams.set("rootId", envRootId);
          }
        }

        // Set maxDepth (you can adjust this value as needed)
        newUrl.searchParams.set("maxDepth", "4");
      }
      window.history.replaceState(null, "", newUrl.toString());
    }
  };

  const setRootId = (id: string | null) => {
    setRootIdState(id);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      if (id) {
        newUrl.searchParams.set("rootId", id);
      } else {
        newUrl.searchParams.delete("rootId");
      }
      window.history.replaceState(null, "", newUrl.toString());
    }
  };

  const setMaxDepth = (depth: number) => {
    setMaxDepthState(depth);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("maxDepth", depth.toString());
      window.history.replaceState(null, "", newUrl.toString());
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        memberModalId,
        setMemberModalId: updateModalId,
        showAvatar,
        setShowAvatar: updateAvatar,
        view,
        setView,
        rootId,
        setRootId,
        maxDepth,
        setMaxDepth,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardState {
  const context = useContext(DashboardContext);
  // Return a safe no-op fallback when used outside DashboardProvider
  // (e.g., on the /dashboard/members/[id] standalone page)
  if (context === undefined) {
    return {
      memberModalId: null,
      setMemberModalId: () => {},
      showAvatar: true,
      setShowAvatar: () => {},
      view: "list",
      setView: () => {},
      rootId: null,
      setRootId: () => {},
      maxDepth: 3,
      setMaxDepth: () => {},
    };
  }
  return context;
}
