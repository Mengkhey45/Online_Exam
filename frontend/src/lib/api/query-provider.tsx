"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";

// Single client per browser tab; a fresh one per request on the server.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server data is refetched deliberately, not on every focus. The
        // student runtime never uses Query for answers (AGENTS §8).
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
