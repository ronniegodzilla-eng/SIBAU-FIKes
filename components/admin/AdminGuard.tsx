'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        router.replace('/admin/login');
      }
    });
    return unsub;
  }, [router]);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Memeriksa sesi admin...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Mengarahkan ke halaman login...
      </div>
    );
  }

  return <>{children}</>;
}
