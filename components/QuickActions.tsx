'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function QuickActions({ petId, petKind }: { petId: string; petKind: string }) {
  const [types, setTypes] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('activity_types').select('*');
      if (!data) return;
      // Filter client-side for simplicity
      setTypes(data.filter(t => (t.default_for_kind || []).includes(petKind)));
    }
    load();
  }, [petKind]);

  async function addActivity(typeId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert('Please sign in');
      return;
    }
    await supabase.from('activities').insert({ pet_id: petId, user_id: user.id, activity_type_id: typeId });
  }

  return (
    <div className="flex gap-3 overflow-x-auto py-3">
      {types.map((t) => (
        <button key={t.id} onClick={() => addActivity(t.id)} className="min-w-[84px] p-3 rounded bg-white shadow">
          <div className="text-sm font-medium capitalize">{t.name}</div>
        </button>
      ))}
    </div>
  );
}
