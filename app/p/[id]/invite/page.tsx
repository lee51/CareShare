'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<any | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Load profile details
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', profileId).single();
      if (!profileData) {
        router.push('/');
        return;
      }
      setProfile(profileData);

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('You must be logged in to create an invite.');
        setLoading(false);
        return;
      }

      // Check for existing valid invite
      const oneMinuteFromNow = new Date(Date.now() + 60000).toISOString();
      const { data: existingInvites, error: fetchError } = await supabase
        .from('p_invites')
        .select('*')
        .eq('p_id', profileId)
        .gt('expires_at', oneMinuteFromNow)
        .order('expires_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        setError('Error fetching invites: ' + fetchError.message);
        setLoading(false);
        return;
      }

      if (existingInvites && existingInvites.length > 0) {
        setInviteId(existingInvites[0].id);
      } else {
        // Create new invite
        const { data: newInvite, error: insertError } = await supabase
          .from('p_invites')
          .insert({
            p_id: profileId,
            created_by: userData.user.id
          })
          .select()
          .single();

        if (insertError) {
          setError('Failed to create invite.');
        } else {
          setInviteId(newInvite.id);
        }
      }

      setLoading(false);
    }
    load();
  }, [profileId, router]);

  if (loading) return <div className="p-4 text-gray-500">Loading invite...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  const inviteUrl = `${window.location.origin}/invite/${inviteId}`;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invite Caretaker</h1>
        <Link href={`/p/${profileId}/settings`} className="text-indigo-600 font-medium hover:text-indigo-500">
          Back
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">
          Invite to {profile?.name}&apos;s Care Team
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Have the new caretaker scan this QR code to join. This invite is valid for 24 hours.
        </p>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner mb-6">
          <QRCodeSVG value={inviteUrl} size={200} />
        </div>

        <div className="w-full text-center">
          <p className="text-xs text-gray-400 mb-2">Or share this link:</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 break-all select-all font-mono">
            {inviteUrl}
          </div>
        </div>
      </div>
    </div>
  );
}
