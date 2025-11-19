'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/storage';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'technical') {
        router.push('/technical/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/auth');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}