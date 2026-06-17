"use client";

/**
 * GardenNarrativeContext — 全站交互叙事状态管理
 *
 * 追踪用户浏览路径，决定角色在各页面的行为：
 * - visitedPages: 已访问的页面（角色会"记住"访客）
 * - currentChapter: 当前主线章节
 * - storyProgress: 0-7 章节进度
 * - characterForm: Solaris 当前形态（人形/章鱼）
 * - clickCount: 连续点击计数（3次触发章鱼彩蛋）
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type PageId = "home" | "articles" | "daily" | "resources" | "writing";
export type CharacterForm = "human" | "octo";
export type Chapter = "prologue" | "guide" | "company" | "riverside" | "rummage" | "library" | "farewell";

interface GardenState {
  visitedPages: Set<PageId>;
  currentChapter: Chapter;
  storyProgress: number;
  characterForm: CharacterForm;
  clickCount: number;
  lastInteraction: number;
  octoTriggered: boolean;
}

interface GardenContextValue extends GardenState {
  visitPage: (page: PageId) => void;
  triggerOctopus: () => void;
  revertToHuman: () => void;
  registerClick: () => boolean; // returns true if 3-click threshold reached
  resetClickCount: () => void;
  getCurrentSceneAction: (page: PageId) => SceneAction;
}

export interface SceneAction {
  solarisAnim: string;
  solarisSay?: string;
  brotherCatAnim?: string;
  brotherCatVisible: boolean;
  youngerCatAnim?: string;
  youngerCatVisible: boolean;
  isRevisit: boolean;
}

const GardenContext = createContext<GardenContextValue | null>(null);

export function useGarden() {
  const ctx = useContext(GardenContext);
  if (!ctx) throw new Error("useGarden must be used within GardenNarrativeProvider");
  return ctx;
}

const CHAPTER_BY_PAGE: Record<PageId, Chapter> = {
  home: "prologue",
  articles: "guide",
  daily: "riverside",
  resources: "rummage",
  writing: "library",
};

export function GardenNarrativeProvider({ children }: { children: React.ReactNode }) {
  const [visitedPages, setVisitedPages] = useState<Set<PageId>>(new Set());
  const [currentChapter, setCurrentChapter] = useState<Chapter>("prologue");
  const [storyProgress, setStoryProgress] = useState(0);
  const [characterForm, setCharacterForm] = useState<CharacterForm>("human");
  const [clickCount, setClickCount] = useState(0);
  const [octoTriggered, setOctoTriggered] = useState(false);
  const lastInteractionRef = useRef(Date.now());

  const visitPage = useCallback((page: PageId) => {
    setVisitedPages((prev) => {
      const next = new Set(prev);
      next.add(page);
      return next;
    });
    setCurrentChapter(CHAPTER_BY_PAGE[page]);
    lastInteractionRef.current = Date.now();
  }, []);

  const triggerOctopus = useCallback(() => {
    setCharacterForm("octo");
    setOctoTriggered(true);
  }, []);

  const revertToHuman = useCallback(() => {
    setCharacterForm("human");
    setOctoTriggered(false);
  }, []);

  const registerClick = useCallback(() => {
    setClickCount((prev) => {
      const next = prev + 1;
      return next >= 3 ? 0 : next; // reset on 3
    });
    return clickCount + 1 >= 3;
  }, [clickCount]);

  const resetClickCount = useCallback(() => setClickCount(0), []);

  const getCurrentSceneAction = useCallback(
    (page: PageId): SceneAction => {
      const isRevisit = visitedPages.has(page) && storyProgress > 0;
      const form = characterForm;

      // Octopus easter egg overrides everything
      if (form === "octo") {
        return {
          solarisAnim: "octo_idle",
          brotherCatVisible: page === "writing" || page === "daily",
          brotherCatAnim: page === "writing" ? "catA_sit_high" : "catA_loaf",
          youngerCatVisible: true,
          youngerCatAnim: "catB_puff", // scared
          isRevisit,
        };
      }

      switch (page) {
        case "home":
          if (isRevisit && storyProgress >= 6) {
            // Farewell chapter
            return {
              solarisAnim: "human_bow",
              solarisSay: "慢慢看吧。反正我,等了很久了。",
              brotherCatVisible: true,
              brotherCatAnim: "catA_loaf",
              youngerCatVisible: true,
              youngerCatAnim: "catB_idle",
              isRevisit,
            };
          }
          return {
            solarisAnim: "human_idle",
            solarisSay: "……又有人闯进来了。",
            brotherCatVisible: true,
            brotherCatAnim: "catA_loaf",
            youngerCatVisible: true,
            youngerCatAnim: "catB_idle",
            isRevisit,
          };

        case "articles":
          return {
            solarisAnim: isRevisit ? "human_sit" : "human_point",
            solarisSay: isRevisit ? undefined : "随便逛。能读懂多少,看你。",
            brotherCatVisible: false,
            youngerCatVisible: true,
            youngerCatAnim: "catB_idle",
            isRevisit,
          };

        case "daily":
          return {
            solarisAnim: "human_lean",
            solarisSay: "今天的天气,有点意思。",
            brotherCatVisible: true,
            brotherCatAnim: "catA_loaf",
            youngerCatVisible: true,
            youngerCatAnim: "catB_idle",
            isRevisit,
          };

        case "resources":
          return {
            solarisAnim: "human_squat",
            solarisSay: "攒了不少东西。有些还能用。",
            brotherCatVisible: false,
            youngerCatVisible: true,
            youngerCatAnim: "catB_dive",
            isRevisit,
          };

        case "writing":
          return {
            solarisAnim: "human_climb",
            solarisSay: undefined,
            brotherCatVisible: true,
            brotherCatAnim: "catA_sit_high",
            youngerCatVisible: false,
            isRevisit,
          };

        default:
          return {
            solarisAnim: "human_idle",
            brotherCatVisible: false,
            youngerCatVisible: false,
            isRevisit,
          };
      }
    },
    [visitedPages, storyProgress, characterForm]
  );

  // Update story progress when visiting new pages
  useEffect(() => {
    setStoryProgress((prev) => Math.max(prev, visitedPages.size));
  }, [visitedPages]);

  const value: GardenContextValue = {
    visitedPages,
    currentChapter,
    storyProgress,
    characterForm,
    clickCount,
    lastInteraction: lastInteractionRef.current,
    octoTriggered,
    visitPage,
    triggerOctopus,
    revertToHuman,
    registerClick,
    resetClickCount,
    getCurrentSceneAction,
  };

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>;
}
