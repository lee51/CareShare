'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setUser(data.user);
      }
    }
    
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (menuOpen && user) {
      setNameInput(user.user_metadata?.name || '');
      setIsEditingName(false);
    }
  }, [menuOpen, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function saveName() {
    if (!nameInput.trim()) {
      setIsEditingName(false);
      return;
    }
    await supabase.auth.updateUser({
      data: { name: nameInput.trim() }
    });
    setIsEditingName(false);
  }

  return (
    <header className="p-4 border-b bg-white relative z-40">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold hover:text-indigo-600 transition-colors">
          CareShare
        </Link>
        
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Account menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveName()}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:border-indigo-500"
                        placeholder="Your name"
                      />
                      <button onClick={saveName} className="text-xs bg-indigo-600 text-white px-2 py-1.5 rounded hover:bg-indigo-700">Save</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.user_metadata?.name || <span className="text-gray-400 italic">No name set</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => setIsEditingName(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 ml-2"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none focus:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
