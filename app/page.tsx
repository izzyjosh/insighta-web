'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center bg-white shadow-lg rounded-2xl p-10">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          Welcome to Insighta
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-gray-600 text-sm sm:text-base">
          A smart platform for generating insights, managing profiles, and
          analyzing data intelligently.
        </p>

        {/* CTA Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Get Started
          </button>
        </div>

        {/* Optional secondary text */}
        <p className="mt-6 text-xs text-gray-400">
          Secure authentication powered by OAuth
        </p>
      </div>
    </div>
  );
}
