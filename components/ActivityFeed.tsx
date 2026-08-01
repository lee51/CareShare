'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ActivityFeed({ petId }: { petId: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from('activities')
        .select('*, activity_types(*)')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!mounted) return;
      setItems(data || []);
    }
    load();

    const channel = supabase
      .channel(`public:activities:pet=${petId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities', filter: `pet_id=eq.${petId}` }, (payload) => {
        setItems((s) => [payload.new, ...s].slice(0, 200));
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [petId]);

  return (
    <div className="mt-2 space-y-2">
      {items.length === 0 && <div className="text-sm text-gray-500">No recent activity</div>}
      {items.map((it) => (
        <div key={it.id} className="p-3 bg-white rounded shadow-sm">
          <div className="text-sm font-medium">{it.activity_types?.name ?? 'action'}</div>
          <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
