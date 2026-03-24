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
  // Post-related state
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;
  isCreatingPost: boolean;
  setIsCreatingPost: (isCreating: boolean) => void;
  editingPostId: string | null;
  setEditingPostId: (id: string | null) => void;
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
  
  // Post states
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Store initialRootId in a ref to use it in setView
  const envRootIdRef = useRef(initialRootId);
  useEffect(() => {
    envRootIdRef.current = initialRootId;
  }, [initialRootId]);

  // Keep state in sync with URL query params
  useEffect(() => {
    const avatarParam = searchParams.get("avatar");
    setShowAvatar(avatarParam !== "hide");

    const viewParam = searchParams.get("view") as ViewMode;
    if (viewParam && viewParam !== view) setViewState(viewParam);

    const rootIdParam = searchParams.get("rootId");
    const effectiveRootId = rootIdParam || initialRootId || null;
    if (effectiveRootId !== rootId) setRootIdState(effectiveRootId);

    const maxDepthParam = searchParams.get("maxDepth");
    if (maxDepthParam) setMaxDepthState(parseInt(maxDepthParam, 10));
    
    // Sync post states from URL if needed
    const postId = searchParams.get("postId");
    if (postId && selectedPostId !== postId) setSelectedPostId(postId);

    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const modalId = sp.get("memberModalId");
      if (modalId && !memberModalId) {
        setMemberModalId(modalId);
      }
    }
  }, [searchParams, memberModalId, rootId, view, initialRootId]);

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
    
    // Always clear post selection states when switching views
    updateSelectedPost(null);
    setIsCreatingPost(false);
    setEditingPostId(null);

    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("view", v);

      if (v === "tree" || v === "mindmap") {
        const currentRootId = rootId || newUrl.searchParams.get("rootId");
        const envRootId = envRootIdRef.current;
        
        if (currentRootId) {
          newUrl.searchParams.set("rootId", currentRootId);
        } else if (envRootId) {
          newUrl.searchParams.set("rootId", envRootId);
        }
        
        newUrl.searchParams.set("maxDepth", "4");
      }
      
      // Clear post-specific URL params when switching views away from posts?
      // Actually, keep them if useful, but maybe clear when switching back to list
      if (v !== "posts") {
        newUrl.searchParams.delete("postId");
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

  const updateSelectedPost = (id: string | null) => {
    setSelectedPostId(id);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      if (id) {
        newUrl.searchParams.set("postId", id);
      } else {
        newUrl.searchParams.delete("postId");
      }
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
        selectedPostId,
        setSelectedPostId: updateSelectedPost,
        isCreatingPost,
        setIsCreatingPost,
        editingPostId,
        setEditingPostId,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardState {
  const context = useContext(DashboardContext);
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
      selectedPostId: null,
      setSelectedPostId: () => {},
      isCreatingPost: false,
      setIsCreatingPost: () => {},
      editingPostId: null,
      setEditingPostId: () => {},
    };
  }
  return context;
}
