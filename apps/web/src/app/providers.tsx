"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState, useEffect } from "react";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { initBrowserTracing } from "@/lib/tracing";

/**
 * Providers Component
 *
 * Wraps the application with necessary providers:
 * - QueryClientProvider: for React Query state management
 * - NotificationProvider: for global notifications
 * - OpenTelemetry Browser Tracing
 *
 * This component must use 'use client' directive since it manages client-side state
 */
function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Initialize browser tracing
  useEffect(() => {
    initBrowserTracing();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export { Providers };
export default Providers;
