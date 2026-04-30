'use client';

import { FaGithub } from 'react-icons/fa';
import { githubLogin } from '@/lib/api';

export default function LoginPage() {
  const handleGithubLogin = () => {
    githubLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center bg-white shadow-lg rounded-2xl p-10 w-full max-w-md">
        {/* App Name */}
        <h1 className="text-4xl font-bold text-gray-900">Insighta Web</h1>

        <p className="text-gray-500 mt-2 text-sm">
          Welcome — sign in to continue
        </p>

        {/* GitHub Login Button */}
        <button
          onClick={handleGithubLogin}
          className="mt-8 w-full flex items-center justify-center gap-3 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
        >
          <FaGithub size={20} />
          Login with GitHub
        </button>
      </div>
    </div>
  );
}
