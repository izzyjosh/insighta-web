'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, getProfiles } from '@/lib/api';

type Stats = {
  totalProfiles: number;
};

type CurrentUser = {
  id: string;
  username: string;
  email: string;
  role: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalProfiles: 0,
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = await getMe();

        if (user.role !== 'admin') {
          router.replace('/profiles');
          return;
        }

        setCurrentUser(user);

        const profileResponse = await getProfiles(
          '/api/profiles?page=1&limit=1'
        );
        setStats({
          totalProfiles: profileResponse.total ?? 0,
        });
      } catch (err) {
        console.error('Failed to load admin dashboard', err);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Insighta Web administration panel
          </p>
          {currentUser && (
            <p className="text-sm text-gray-600 mt-2">
              Signed in as{' '}
              <span className="font-semibold">{currentUser.username}</span> (
              {currentUser.email})
            </p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Profiles" value={stats.totalProfiles} />
          <StatCard
            label="Access Level"
            value={currentUser?.role === 'admin' ? 1 : 0}
            valueLabel="admin"
          />
          <StatCard label="Backend Guard" value={1} valueLabel="enabled" />
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/profiles"
            className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition text-center"
          >
            Open Profiles
          </Link>

          <Link
            href="/accounts"
            className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition text-center"
          >
            My Account
          </Link>

          <Link
            href="/profiles/search"
            className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition text-center"
          >
            Search Profiles
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-500 text-center">
          Admin access only
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value: number;
  valueLabel?: string;
}) {
  return (
    <div className="bg-gray-50 border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-2">
        {valueLabel ?? value.toLocaleString()}
      </p>
    </div>
  );
}
