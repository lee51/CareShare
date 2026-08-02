'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import QuickActions from '../../../components/QuickActions';
import ActivityFeed from '../../../components/ActivityFeed';
import Chat from '../../../components/Chat';
import { useRouter } from 'next/navigation';

export default function PetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = use(params);
  const [pet, setPet] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('pets').select('*').eq('id', petId).single();
      if (!data) {
        // If not visible due to RLS, redirect home
        router.push('/');
        return;
      }
      setPet(data);
    }
    load();

    const sub = supabase
      .channel(`public:activities:pet=${petId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities', filter: `pet_id=eq.${petId}` }, (payload) => {
        // no-op: ActivityFeed subscribes separately
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(sub);
    };
  }, [petId, router]);

  if (!pet) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{pet.name}</h2>
          <div className="text-sm text-gray-600">{pet.kind}</div>
        </div>
        <button 
          onClick={() => router.push(`/pet/${pet.id}/settings`)}
          className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <section className="mt-4">
        <h3 className="font-medium">Quick actions</h3>
        <QuickActions petId={pet.id} petKind={pet.kind} petMetadata={pet.metadata} />
      </section>

      <section className="mt-4">
        <h3 className="font-medium">Activity</h3>
        <ActivityFeed petId={pet.id} />
      </section>

      <section className="mt-4">
        <h3 className="font-medium">Chat</h3>
        <Chat petId={pet.id} />
      </section>
    </div>
  );
}
