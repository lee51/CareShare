'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [choice, setChoice] = useState<'pet' | 'person' | null>(null);
  const [petKind, setPetKind] = useState<'dog' | 'cat'>('dog');
  const [petName, setPetName] = useState('');
  const router = useRouter();

  async function createPet() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      await supabase.auth.signInWithOAuth({ provider: 'github' });
      return;
    }

    const { data, error } = await supabase.from('pets').insert({
      name: petName || (petKind === 'dog' ? 'Doggo' : 'Kitty'),
      kind: petKind
    }).select().single();

    if (error) {
      console.error(error);
      return;
    }

    await supabase.from('pet_caretakers').upsert({
      pet_id: data.id,
      user_id: user.id,
      role: 'owner'
    });

    router.push(`/pet/${data.id}`);
  }

  return (
    <div>
      <h2 className="text-lg font-medium">Welcome</h2>

      {!choice ? (
        <div className="mt-6 space-y-3">
          <button className="w-full py-3 rounded bg-indigo-600 text-white" onClick={() => setChoice('pet')}>Pet care</button>
          <button className="w-full py-3 rounded bg-gray-200 text-gray-600" onClick={() => setChoice('person')}>Person care (coming)</button>
        </div>
      ) : (
        <div className="mt-6">
          <h3 className="font-semibold">Create a pet</h3>
          <label className="block mt-3">
            <div className="text-sm text-gray-600">Name</div>
            <input value={petName} onChange={e => setPetName(e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
          </label>
          <label className="block mt-3">
            <div className="text-sm text-gray-600">Kind</div>
            <select value={petKind} onChange={e => setPetKind(e.target.value as any)} className="mt-1 block w-full rounded border px-3 py-2">
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </label>
          <div className="mt-4">
            <button className="py-2 px-4 rounded bg-indigo-600 text-white" onClick={createPet}>Create & open</button>
            <button className="ml-3 py-2 px-4 rounded bg-gray-100" onClick={() => setChoice(null)}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
