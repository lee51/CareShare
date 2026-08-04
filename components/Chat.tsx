'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Chat({ profileId }: { profileId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('p_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!mounted) return;
      setMessages(data || []);
    }
    load();

    const channel = supabase
      .channel(`public:messages:profile=${profileId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `p_id=eq.${profileId}` }, (payload) => {
        setMessages((s) => [payload.new, ...s]);
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [profileId]);

  async function send() {
    if (!text.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert('Please sign in');
      return;
    }
    await supabase.from('messages').insert({ p_id: profileId, user_id: user.id, content: text.trim() });
    setText('');
  }

  return (
    <div>
      <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
        {messages.map(m => (
          <div key={m.id} className="p-2 bg-white rounded shadow-sm">
            <div className="text-xs text-gray-600">{new Date(m.created_at).toLocaleString()}</div>
            <div className="mt-1">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message caretakers" className="flex-1 rounded border px-3 py-2" />
        <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={send}>Send</button>
      </div>
    </div>
  );
}
