'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import QuickActions from '../../../components/QuickActions';
import ActivityFeed from '../../../components/ActivityFeed';
import Chat from '../../../components/Chat';
import { useRouter } from 'next/navigation';

export default function PetPage({ params }: { params: { id: string } }) {
  const petId = params.id;
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
      </div>

      <section className="mt-4">
        <h3 className="font-medium">Quick actions</h3>
        <QuickActions petId={pet.id} petKind={pet.kind} />
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
