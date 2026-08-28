'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Feather, Mail, Lock, User, ArrowRight } from 'lucide-react';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create account.');
        setLoading(false);
        return;
      }

      router.push('/library');
      router.refresh();
    } catch (err) {
      setError('Network error creating account.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 shadow-xl shadow-rose-500/10">
            <Feather className="w-6 h-6 text-rose-400" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100 tracking-tight">
            CREATE ACCOUNT
          </h1>
          <p className="text-xs text-rose-200/90 font-serif italic">
            Join The Story Library to purchase & read digital books
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs relative z-10">
          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ananya Sharma"
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="reader@example.com"
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON - VELVET ROSE CRIMSON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading ? 'Creating Account...' : 'REGISTER & START READING'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative z-10">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#1C2638]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow border-t border-[#1C2638]"></div>
          </div>

          <SocialAuthButtons redirectUrl="/library" />
        </div>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1C2638] relative z-10">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-rose-400 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
}