'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await getMe();

        // Redirect based on user role
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/profiles');
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        router.replace('/login');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Authenticating...</h1>
        <p className="text-gray-500 mt-2">
          Please wait while we process your login
        </p>
      </div>
    </div>
  );
}
