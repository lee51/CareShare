'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function getLocalISOString() {
  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
}

export default function QuickActions({ profileId, profileKind, profileMetadata }: { profileId: string; profileKind: string; profileMetadata?: any }) {
  const [types, setTypes] = useState<any[]>([]);
  
  // Modal state
  const [selectedType, setSelectedType] = useState<any | null>(null);
  const [timeStr, setTimeStr] = useState<string>('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('activity_types').select('*');
      if (!data) return;
      
      const savedActionIds = profileMetadata?.quick_actions;
      
      if (Array.isArray(savedActionIds)) {
        // Use user configured settings
        setTypes(data.filter(t => savedActionIds.includes(t.id)));
      } else {
        // Default to food, pee, poop, nap
        const defaultNames = ['food', 'pee', 'poop', 'nap'];
        setTypes(data.filter(t => defaultNames.includes(t.name.toLowerCase())));
      }
    }
    load();
  }, [profileKind, profileMetadata?.quick_actions]);

  function handleActionClick(type: any) {
    setSelectedType(type);
    setTimeStr(getLocalISOString());
    setComment('');
  }

  function closePopup() {
    setSelectedType(null);
  }

  async function submitActivity() {
    if (!selectedType) return;
    
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    
    if (!user) {
      alert('Please sign in');
      setSubmitting(false);
      return;
    }

    // Convert local datetime string back to UTC Date object
    const createdDate = new Date(timeStr);
    
    await supabase.from('activities').insert({
      p_id: profileId,
      user_id: user.id,
      activity_type_id: selectedType.id,
      created_at: createdDate.toISOString(),
      metadata: comment.trim() ? { note: comment.trim() } : {}
    });

    setSubmitting(false);
    closePopup();
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto py-3">
        {types.map((t) => (
          <button 
            key={t.id} 
            onClick={() => handleActionClick(t)} 
            className="min-w-[84px] p-3 rounded bg-white shadow hover:bg-gray-50 transition-colors"
          >
            <div className="text-sm font-medium capitalize">{t.name}</div>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 capitalize">
                Log {selectedType.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                When did this happen and any extra notes?
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input 
                    type="datetime-local" 
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="E.g. Ate half a bowl"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-4 flex justify-end gap-2 border-t">
              <button 
                onClick={closePopup}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitActivity}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 disabled:opacity-70 disabled:scale-100 transition-all"
              >
                {submitting ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
