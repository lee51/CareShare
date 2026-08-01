'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [choice, setChoice] = useState<'pet' | 'person' | null>(null);
  const [petKind, setPetKind] = useState<'dog' | 'cat'>('dog');
  const [petName, setPetName] = useState('');
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function openExistingPet(userId: string) {
      const { data, error } = await supabase
        .from('pet_caretakers')
        .select('pet_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setCheckingAuth(false);
        return;
      }

      if (data?.pet_id) {
        router.replace(`/pet/${data.pet_id}`);
        return;
      }

      setCheckingAuth(false);
    }

    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;

      if (!mounted) return;

      if (!userId) {
        router.replace('/login');
        return;
      }

      openExistingPet(userId);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      openExistingPet(session.user.id);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function createPet() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      router.push('/login');
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

    // The pet_caretakers record is now automatically created by the on_pet_created trigger in Postgres

    router.push(`/pet/${data.id}`);
  }

  if (checkingAuth) {
    return <div className="text-sm text-gray-600">Loading...</div>;
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
