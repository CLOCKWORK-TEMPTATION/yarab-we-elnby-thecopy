"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

export default function DirectorsStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto px-4 py-8">{children}</div>
      <Toaster />
    </QueryClientProvider>
  );
}
