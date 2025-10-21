import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SwissStartupConnect from "./SwissStartupConnect";

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 2, // Retry failed requests twice
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Garbage collection time for unused cache (10 minutes)
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SwissStartupConnect />
    </QueryClientProvider>
  );
}

export default App;
