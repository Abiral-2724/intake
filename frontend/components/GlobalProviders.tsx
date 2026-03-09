"use client";
import dynamic from "next/dynamic";

// Lazy-load AI assistant so it doesn't block initial page render
const AIAssistant = dynamic(() => import("./Aiassistant"), { ssr: false });

export default function GlobalProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AIAssistant />
    </>
  );
}