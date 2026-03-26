"use client";

import dynamic from "next/dynamic";
import { BreakdownLoadingState } from "./breakdown-ui";

const BreakdownContent = dynamic(() => import("./breakdown-content"), {
  loading: () => <BreakdownLoadingState />,
  ssr: false,
});

export default function BreakdownPage() {
  return <BreakdownContent />;
}
