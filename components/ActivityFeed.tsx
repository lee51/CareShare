'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ActivityFeed({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from('activities')
        .select('*, activity_types(*)')
        .eq('p_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!mounted) return;
      setItems(data || []);
    }
    load();

    const channel = supabase
      .channel(`public:activities:profile=${profileId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities', filter: `p_id=eq.${profileId}` }, (payload) => {
        setItems((s) => [payload.new, ...s].slice(0, 200));
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [profileId]);

  return (
    <div className="mt-2 space-y-2">
      {items.length === 0 && <div className="text-sm text-gray-500">No recent activity</div>}
      {items.map((it) => (
        <div key={it.id} className="p-3 bg-white rounded shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium capitalize">{it.activity_types?.name ?? 'action'}</div>
            <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
          </div>
          {it.metadata?.note && (
            <div className="text-sm text-gray-700 mt-1.5 p-2 bg-gray-50 rounded italic border-l-2 border-indigo-300">
              {it.metadata.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
