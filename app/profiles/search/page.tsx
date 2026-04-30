'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getProfiles } from '@/lib/api';

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

type SearchResponse = {
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

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [nextLink, setNextLink] = useState<string | null>(null);
  const [prevLink, setPrevLink] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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

  const runSearch = async (url?: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && !url) return;

    setLoading(true);

    try {
      const searchUrl =
        url ||
        `/api/profiles/search?q=${encodeURIComponent(trimmedQuery)}&page=1&limit=10`;
      const data = (await getProfiles(searchUrl)) as SearchResponse;

      setResults(data.data);
      setPage(data.page);
      setLimit(data.limit);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setNextLink(data.links.next);
      setPrevLink(data.links.prev);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runSearch();
  };

  const handleNextPage = () => {
    const resolvedNextLink = resolveLink(nextLink);
    if (resolvedNextLink) {
      runSearch(resolvedNextLink);
    }
  };

  const handlePreviousPage = () => {
    const resolvedPrevLink = resolveLink(prevLink);
    if (resolvedPrevLink) {
      runSearch(resolvedPrevLink);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Natural Language Search
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Try: &quot;female adults from US aged 25&quot;
            </p>
          </div>

          <Link
            href="/profiles"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Back to Profiles
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search profiles in natural language..."
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              Search
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">
              gender: male
            </span>
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">
              country: TZ
            </span>
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">
              age 20 to 35
            </span>
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">
              age group adult
            </span>
          </div>
        </form>

        {hasSearched && (
          <div className="mt-6 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing{' '}
              <span className="font-semibold text-blue-700">
                {results.length}
              </span>{' '}
              of <span className="font-semibold text-blue-700">{total}</span>{' '}
              results
            </p>
            <p>
              Page <span className="font-semibold text-blue-700">{page}</span>{' '}
              of{' '}
              <span className="font-semibold text-blue-700">{totalPages}</span>
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && <p className="mt-6 text-sm text-gray-500">Searching...</p>}

        {/* Results */}
        <div className="mt-6 space-y-3">
          {!loading && hasSearched && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No profiles matched that search.
            </div>
          )}

          {results.map((profile) => (
            <div
              key={profile.id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/profiles/${profile.id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-blue-700 hover:underline"
                  >
                    {profile.name}
                  </Link>

                  <p className="mt-1 text-sm text-gray-600">
                    {profile.gender} (
                    {Math.round(profile.gender_probability * 100)}%),{' '}
                    {profile.age} ({profile.age_group})
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {profile.country_name} ({profile.country_id})
                  </p>
                </div>

                <div className="text-xs text-gray-500 sm:text-right">
                  <p>Confidence</p>
                  <p className="font-semibold text-gray-800">
                    {Math.round(profile.country_probability * 100)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-blue-700">{limit}</span> per
            page
          </div>

          <div className="flex gap-3">
            <button
              disabled={!prevLink || loading}
              onClick={handlePreviousPage}
              className="rounded-xl border-2 border-blue-600 px-5 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              Previous
            </button>

            <button
              disabled={!nextLink || loading}
              onClick={handleNextPage}
              className="rounded-xl border-2 border-blue-600 px-5 py-2 font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
