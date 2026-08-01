'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PetSettingsPage({ params }: { params: { id: string } }) {
  const petId = params.id;
  const router = useRouter();
  
  const [pet, setPet] = useState<any | null>(null);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      // Load pet details
      const { data: petData } = await supabase.from('pets').select('*').eq('id', petId).single();
      if (!petData) {
        router.push('/');
        return;
      }
      setPet(petData);

      // Load all available activity types
      const { data: typesData, error: typesError } = await supabase.from('activity_types').select('*');
      
      if (typesError) {
        console.error("Error loading activity types:", typesError);
        alert(`Error loading activity types: ${typesError.message}`);
      }

      if (typesData) {
        setActivityTypes(typesData);
      }

      // Initialize selected actions
      const savedActionIds = petData.metadata?.quick_actions;
      if (Array.isArray(savedActionIds)) {
        setSelectedActionIds(new Set(savedActionIds));
      } else if (typesData && typesData.length > 0) {
        // Default to the 4 specific actions if not set
        const defaultNames = ['food', 'pee', 'poop', 'nap'];
        const defaultIds = typesData
          .filter(t => defaultNames.includes(t.name.toLowerCase()))
          .map(t => t.id);
        setSelectedActionIds(new Set(defaultIds));
      }
      setLoading(false);
    }
    load();
  }, [petId, router]);

  const toggleAction = (id: string) => {
    setSelectedActionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updatedMetadata = {
      ...pet.metadata,
      quick_actions: Array.from(selectedActionIds)
    };

    const { error } = await supabase
      .from('pets')
      .update({ metadata: updatedMetadata })
      .eq('id', petId);

    setSaving(false);
    if (!error) {
      router.push(`/pet/${petId}`);
    } else {
      alert('Failed to save settings');
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Link href={`/pet/${petId}`} className="text-indigo-600 font-medium hover:text-indigo-500">
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h2>
        <p className="text-sm text-gray-500 mb-6">
          Select which quick actions you want to appear on {pet?.name}'s home screen.
        </p>

        <div className="space-y-3">
          {activityTypes.length === 0 && (
            <div className="p-4 text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl text-center">
              No activity types found in the database. Please ensure you have run the seed script.
            </div>
          )}
          {activityTypes.map(type => (
            <label 
              key={type.id} 
              className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                selectedActionIds.has(type.id) 
                  ? 'border-indigo-500 bg-indigo-50/50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 capitalize">{type.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">Show on home screen</div>
              </div>
              <div className="relative flex items-center justify-center w-6 h-6 ml-4">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={selectedActionIds.has(type.id)}
                  onChange={() => toggleAction(type.id)}
                />
                <div className="w-6 h-6 border-2 rounded border-gray-300 peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-colors"></div>
                <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-8 py-3.5 px-4 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
