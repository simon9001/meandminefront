'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ReduxProvider } from '@/components/ReduxProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  }));

  return (
    <ReduxProvider>
      <QueryClientProvider client={qc}>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
