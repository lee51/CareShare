'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function RequireName({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Exempt pages that don't require name check
    if (pathname === '/login' || pathname.startsWith('/profile/name')) {
      return;
    }

    let mounted = true;

    async function checkName() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!mounted) return;

      if (user && !user.user_metadata?.name?.trim()) {
        const nextParam = encodeURIComponent(pathname);
        router.replace(`/profile/name?next=${nextParam}`);
      }
    }

    checkName();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !session.user.user_metadata?.name?.trim()) {
        if (pathname !== '/login' && !pathname.startsWith('/profile/name')) {
          const nextParam = encodeURIComponent(pathname);
          router.replace(`/profile/name?next=${nextParam}`);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  return <>{children}</>;
}
