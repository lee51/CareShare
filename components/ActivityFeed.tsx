'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ActivityFeed({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    await supabase.from('activities').delete().eq('id', id);
  };

  const handleEdit = (it: any) => {
    setEditingId(it.id);
    setEditNote(it.metadata?.note || '');
    // format as local datetime-local string
    const d = new Date(it.created_at);
    // YYYY-MM-DDTHH:mm format required for input type="datetime-local"
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    setEditDate(localISOTime);
  };

  const handleSave = async (id: string, originalMeta: any) => {
    const updatedMeta = { ...originalMeta, note: editNote };
    const updatedCreatedAt = new Date(editDate).toISOString();

    await supabase
      .from('activities')
      .update({ metadata: updatedMeta, created_at: updatedCreatedAt })
      .eq('id', id);

    setEditingId(null);
  };

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities', filter: `p_id=eq.${profileId}` }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('activities')
            .select('*, activity_types(*)')
            .eq('id', payload.new.id)
            .single();
          setItems((s) => [data || payload.new, ...s].slice(0, 200));
        } else if (payload.eventType === 'UPDATE') {
          setItems((s) => s.map((it) => it.id === payload.new.id ? { ...it, ...payload.new } : it));
        } else if (payload.eventType === 'DELETE') {
          setItems((s) => s.filter((it) => it.id !== payload.old?.id));
        }
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
        <div key={it.id} className="p-3 bg-white rounded shadow-sm relative group">
          {editingId === it.id ? (
            <div className="space-y-2">
              <div className="text-sm font-medium capitalize">{it.activity_types?.name ?? 'action'}</div>
              <input
                type="datetime-local"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full text-sm p-1 border rounded"
              />
              <textarea
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full text-sm p-1 border rounded"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button onClick={() => handleSave(it.id, it.metadata || {})} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="flex items-center justify-between cursor-pointer" 
                onClick={() => handleEdit(it)}
              >
                <div className="text-sm font-medium capitalize">{it.activity_types?.name ?? 'action'}</div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleDelete(it.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              {it.metadata?.note && (
                <div 
                  onClick={() => handleEdit(it)}
                  className="cursor-pointer text-sm text-gray-700 mt-1.5 p-2 bg-gray-50 rounded italic border-l-2 border-indigo-300 hover:bg-gray-100 transition-colors"
                >
                  {it.metadata.note}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
