'use client';

import { useEffect, useState } from 'react';
import { getMe, logout } from '@/lib/api';
import toast from 'react-hot-toast';
import { APIError } from '@/lib/error.handler';

type User = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'analyst';
  avatar_url?: string;
};

export default function UserAccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error('Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await getMe();
        setUser(data);
      } catch (err: unknown) {
        toast.error(
          (err as APIError).message || 'Failed to fetch user. Please try again.'
        );
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading user...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {user.username}
          </h1>
          <p className="text-gray-500 text-sm">My Account</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Info label="Email" value={user.email} />

          <Info
            label="Role"
            value={
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  user.role === 'admin'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {user.role}
              </span>
            }
          />

          <Info label="User ID" value={user.id} />
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800">
              Edit User
            </button>

            <button className="flex-1 border border-red-300 text-red-600 py-3 rounded-lg hover:bg-red-50">
              Disable User
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>

          <button
            onClick={() => window.history.back()}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 text-gray-900 font-medium">{value}</div>
    </div>
  );
}
