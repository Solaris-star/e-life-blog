"use client";

import dynamic from "next/dynamic";

// GardenStage uses usePathname + canvas, must be client-side only
const GardenStage = dynamic(() => import("./GardenStage"), { ssr: false });

export default function ClientGardenStage() {
  return <GardenStage />;
}
