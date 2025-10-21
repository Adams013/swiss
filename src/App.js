import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SwissStartupConnect from "./SwissStartupConnect";

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      retry: 2, // Retry failed requests twice
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Cache kept for 10 minutes
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
