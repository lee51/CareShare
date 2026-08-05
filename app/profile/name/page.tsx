'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function ProfileNameForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!data?.user) {
        router.replace('/login');
        return;
      }
      setName(data.user.user_metadata?.name || '');
      setLoading(false);
    }
    loadUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { name: trimmed },
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const nextUrl = searchParams.get('next') || '/';
    router.replace(nextUrl);
  }

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to CareShare!</h2>
      <p className="text-sm text-gray-600 mb-6">
        Please enter your display name so other caretakers know who you are.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name-input" className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Smith"
            required
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
}

export default function ProfileNamePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-gray-500">Loading...</div>}>
      <ProfileNameForm />
    </Suspense>
  );
}
