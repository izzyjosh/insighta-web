'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfiles, exportProfiles } from '@/lib/api';

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

type PaginationData = {
  status: string;
  data: Profile[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  links: {
    self: string;
    next: string | null;
    prev: string | null;
  };
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [nextLink, setNextLink] = useState<string | null>(null);
  const [prevLink, setPrevLink] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // filters
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');

  const isAdmin = true;
  const apiBasePath = '/api/profiles';

  const buildUrl = useCallback(
    (
      pageNum: number = 1,
      filters?: { name?: string; gender?: string; country?: string }
    ) => {
      const params = new URLSearchParams();
      if (filters?.name) params.append('name', filters.name);
      if (filters?.gender) params.append('gender', filters.gender);
      if (filters?.country)
        params.append('country_id', filters.country?.toUpperCase());
      params.append('page', pageNum.toString());
      params.append('limit', '10');

      return `${apiBasePath}?${params.toString()}`;
    },
    [apiBasePath]
  );

  const resolveLink = (link: string | null) => {
    if (!link) {
      return null;
    }

    if (link.startsWith('http://') || link.startsWith('https://')) {
      return link;
    }

    return link.startsWith('/api/')
      ? link
      : `/api${link.startsWith('/') ? link : `/${link}`}`;
  };

  const fetchProfiles = useCallback(
    async (url?: string) => {
      try {
        const finalUrl =
          url ||
          (name && name.trim() !== ''
            ? `/api/profiles/search?q=${encodeURIComponent(name)}&page=1&limit=10`
            : buildUrl(1, { gender, country }));

        const data: PaginationData = await getProfiles(finalUrl);

        setProfiles(data.data);
        setPage(data.page);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setNextLink(data.links.next);
        setPrevLink(data.links.prev);
      } catch (err) {
        console.error('Failed to fetch profiles', err);
        setProfiles([]);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl, country, gender, name]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchProfiles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchProfiles]);

  const handleNextPage = () => {
    const resolvedNextLink = resolveLink(nextLink);
    if (resolvedNextLink) {
      setLoading(true);
      fetchProfiles(resolvedNextLink);
    }
  };

  const handlePreviousPage = () => {
    const resolvedPrevLink = resolveLink(prevLink);
    if (resolvedPrevLink) {
      setLoading(true);
      fetchProfiles(resolvedPrevLink);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProfiles({ gender, country });
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export profiles');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
            <p className="text-gray-500 text-sm">Filter and manage profiles</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>

            <Link
              href="/profiles/search"
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Search Profiles
            </Link>

            <Link
              href="/accounts"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              My Account
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            placeholder="Search by name..."
            className="border border-gray-300 rounded-lg bg-white px-4 py-2 text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <input
            type="text"
            placeholder="Country (e.g. US)"
            className="border border-gray-300 rounded-lg bg-white px-4 py-2 text-gray-900 placeholder:text-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 text-white text-left sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Gender</th>
                <th className="px-4 py-3 font-semibold">Age</th>
                <th className="px-4 py-3 font-semibold">Age Group</th>
                <th className="px-4 py-3 font-semibold">Country</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                {isAdmin && (
                  <th className="px-4 py-3 font-semibold">Created At</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No profiles found
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="hover:bg-blue-50 transition-colors bg-white"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link
                        href={`/profiles/${profile.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition"
                      >
                        {profile.name}
                      </Link>
                    </td>

                    <td className="px-4 py-3 capitalize text-gray-700">
                      {profile.gender} (
                      {Math.round(profile.gender_probability * 100)}%)
                    </td>

                    <td className="px-4 py-3 text-gray-700">{profile.age}</td>

                    <td className="px-4 py-3 capitalize text-gray-700">
                      {profile.age_group}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {profile.country_name} ({profile.country_id})
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {Math.round(profile.country_probability * 100)}%
                    </td>

                    {isAdmin && (
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(profile.created_at).toLocaleString()}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700 font-medium">
            Page <span className="font-bold text-blue-600">{page}</span> of{' '}
            <span className="font-bold text-blue-600">{totalPages}</span>
            <span className="ml-2">({total} total profiles)</span>
          </div>

          <div className="flex gap-3">
            <button
              disabled={!prevLink}
              onClick={handlePreviousPage}
              className="px-6 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 active:bg-blue-100 disabled:border-gray-300 disabled:text-gray-400"
            >
              ← Previous
            </button>

            <button
              disabled={!nextLink}
              onClick={handleNextPage}
              className="px-6 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 active:bg-blue-100 disabled:border-gray-300 disabled:text-gray-400"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
