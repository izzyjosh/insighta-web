'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getMe, getProfile } from '@/lib/api';
import toast from 'react-hot-toast';
import { APIError } from '@/lib/error.handler';

type Profile = {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: string;
};

export default function ProfileDetailPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = true; // replace with real auth later

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [data, user] = await Promise.all([
          getProfile(id as string),
          getMe(),
        ]);

        setProfile(data.data);
        setAccountId(user.id);
      } catch (err: unknown) {
        console.error('Failed to fetch profile', err);
        toast.error(
          (err as APIError).message ||
            'Failed to load profile. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Profile not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {profile.name}
          </h1>
          <p className="text-gray-500 text-sm">Profile details</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Detail label="Gender">
            {profile.gender} ({Math.round(profile.gender_probability * 100)}%)
          </Detail>

          <Detail label="Age">{profile.age}</Detail>

          <Detail label="Age Group">{profile.age_group}</Detail>

          <Detail label="Country">
            {profile.country_name} ({profile.country_id})
          </Detail>

          <Detail label="Country Confidence">
            {Math.round(profile.country_probability * 100)}%
          </Detail>

          {isAdmin && (
            <Detail label="Created At">
              {new Date(profile.created_at).toLocaleString()}
            </Detail>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center">
          <span className="text-xs text-gray-400">ID: {profile.id}</span>

          <div className="flex items-center gap-3">
            {accountId && (
              <Link
                href="/accounts"
                className="px-4 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white font-semibold shadow-sm transition hover:bg-blue-700 hover:border-blue-700"
              >
                My Account
              </Link>
            )}

            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded-lg border-2 border-gray-400 bg-white text-gray-700 font-semibold shadow-sm transition hover:border-gray-500 hover:bg-gray-50 hover:text-gray-900"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 border rounded-lg p-4">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-gray-900 mt-1 font-medium">{children}</p>
    </div>
  );
}
