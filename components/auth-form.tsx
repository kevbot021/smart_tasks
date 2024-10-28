"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type AuthFormProps = {
  mode: 'signup' | 'login';
};

export default function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        router.push('/todo');
      } else {
        // 1. Create user account
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // 2. Add user to the users table as admin
          const { error: userError } = await supabase
            .from('users')
            .insert({ 
              id: authData.user.id, 
              name, 
              email, 
              role: 'admin',
              team_id: null  // We'll update this after creating the team
            });

          if (userError) throw userError;

          // 3. Create team
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .insert({ name: teamName, admin_user_id: authData.user.id })
            .select()
            .single();

          if (teamError) throw teamError;

          // 4. Update user with team_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ team_id: teamData.id })
            .eq('id', authData.user.id);

          if (updateError) throw updateError;

          router.push('/todo');
        }
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      )}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      {mode === 'signup' && (
        <input
          type="text"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      )}
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">
        {mode === 'signup' ? 'Sign Up' : 'Log In'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}
