'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Chat({ profileId }: { profileId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (mounted && data?.user) {
        setCurrentUser(data.user);
      }
    }
    loadUser();

    async function load() {
      const { data } = await supabase
        .from('messages_with_senders')
        .select('*')
        .eq('p_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (!mounted) return;
      const sorted = (data ?? []).slice().reverse();
      setMessages(sorted);
    }
    load();

    const channel = supabase
      .channel(`public:messages:profile=${profileId}-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `p_id=eq.${profileId}` }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [profileId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert('Please sign in');
      return;
    }
    const senderName = user.user_metadata?.name ?? user.email ?? 'Caretaker';
    const content = text.trim();
    setText('');

    const { data } = await supabase
      .from('messages')
      .insert({
        p_id: profileId,
        user_id: user.id,
        content,
      })
      .select()
      .single();

    if (data) {
      const newMsg = {
        ...data,
        sender_name: data.sender_name ?? senderName,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    }
  }

  return (
    <div>
      <div className="space-y-3 max-h-64 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
        {messages.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">No messages yet. Send a message to start chatting!</div>
        ) : (
          messages.map((m) => {
            const isMe = Boolean(currentUser?.id && m.user_id === currentUser.id);
            const rawName = m.sender_name ?? m.metadata?.sender_name;
            const senderName = isMe
              ? (rawName ? `${rawName} (You)` : 'You')
              : (rawName ?? 'Caretaker');

            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span className="text-xs font-semibold text-gray-700">{senderName}</span>
                  <span className="text-[10px] text-gray-400">
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                  isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message caretakers"
          className="flex-1 rounded border px-3 py-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button className="px-3 py-2 rounded bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}

