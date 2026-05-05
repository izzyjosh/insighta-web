'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          const user = await getMe();

          // Redirect based on user role
          if (user.role === 'admin') {
            router.replace('/admin/dashboard');
          } else {
            router.replace('/profiles');
          }
          return;
        } catch (error) {
          retries++;
          console.error(`Authentication attempt ${retries} failed:`, error);
          
          if (retries < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // After all retries fail, redirect to login
      const returnTo = '/auth/callback';
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
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
