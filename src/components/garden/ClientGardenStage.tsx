"use client";

import dynamic from "next/dynamic";
import type { PageId } from "./GardenNarrativeContext";

const GardenStage = dynamic(() => import("./GardenStage"), { ssr: false });

export default function ClientGardenStage({ page }: { page: PageId }) {
  return <GardenStage page={page} />;
}
