'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AcceptInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: inviteId } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Fetch invite and profile via secure RPC
      const { data, error: inviteError } = await supabase.rpc('get_invite', { invite_id: inviteId });

      if (!mounted) return;

      if (inviteError || !data || data.length === 0) {
        setError('Invalid or expired invite.');
        setLoading(false);
        return;
      }

      const inviteData = data[0];
      if (inviteData.used_by) {
        setError('This invitation link has already been used.');
        setLoading(false);
        return;
      }

      setInvite(inviteData);
      setProfile({
        name: inviteData.profile_name,
        kind: inviteData.profile_kind,
      });

      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      setLoading(false);
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [inviteId]);

  const [token, setToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/invite/${inviteId}`,
        },
      });
      if (error) throw error;
      setOtpSent(true);
      setMessage("We've sent a magic link & one-time code to your email.");
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Invalid one-time code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invite) return;
    setAccepting(true);
    
    const { data, error } = await supabase.rpc('accept_invite', { invite_id: inviteId });
      
    setAccepting(false);

    if (error) {
      alert('Failed to accept invite: ' + error.message);
    } else if (data) {
      router.push(`/p/${data}`);
    } else {
      router.push(`/p/${invite.p_id}`);
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading invite...</div>;

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invite Unavailable</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="text-indigo-600 font-medium hover:text-indigo-500">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            You&apos;ve been invited!
          </h1>
          <p className="text-white/80 text-sm">
            {profile ? `Join ${profile.name}'s care team` : 'Join the care team'}
          </p>
        </div>

        {!user ? (
          !otpSent ? (
            <form onSubmit={handleAuth} className="space-y-6">
              <p className="text-white text-sm text-center">Please sign in or create an account to accept the invitation.</p>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 px-4 bg-white text-purple-900 font-semibold rounded-xl shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-purple-500 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Sending link...' : 'Send Magic Link / Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {message && (
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm font-medium text-center">
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5" htmlFor="token">
                  One-Time Code
                </label>
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all tracking-widest text-center text-xl font-mono"
                  placeholder="123456"
                  required
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3.5 px-4 bg-white text-purple-900 font-semibold rounded-xl shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-purple-500 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {verifying ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setMessage(null);
                    setError(null);
                    setToken('');
                  }}
                  className="text-xs text-white/70 hover:text-white underline transition-colors"
                >
                  Use a different email or resend code
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="space-y-6 text-center">
            <p className="text-white text-lg">
              Ready to join?
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-3.5 px-4 bg-white text-purple-900 font-semibold rounded-xl shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-purple-500 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {accepting ? 'Accepting...' : 'Accept Invite'}
            </button>
            <p className="text-white/60 text-xs">
              Logged in as {user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
