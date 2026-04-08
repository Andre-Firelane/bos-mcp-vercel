'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => router.refresh());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return <>{children}</>;
}
