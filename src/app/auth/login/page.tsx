'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SocialAuthButtons from '@/components/SocialAuthButtons';
import { Feather, Lock, Mail, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/library';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#121826] border border-[#232F47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-500/30 mx-auto">
          <Feather className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
          WELCOME BACK
        </h1>
        <p className="text-xs text-slate-400 font-serif italic">
          Log in to access your digital library & continue reading
        </p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
        <div>
          <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@example.com"
              className="w-full bg-[#0B0F19] border border-[#2A364F] focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-300 font-bold uppercase tracking-wider block">
              Password
            </label>
            <Link href="/auth/forgot-password" className="text-amber-400 hover:underline text-[11px]">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0B0F19] border border-[#2A364F] focus:border-amber-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2D] hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>LOG IN</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[#1C2638]" />
        <span className="text-[11px] text-slate-500 font-semibold uppercase">Or Continue With</span>
        <div className="flex-1 h-px bg-[#1C2638]" />
      </div>

      {/* Social Auth Buttons */}
      <SocialAuthButtons redirectUrl={redirectUrl} />

      <div className="bg-[#0B0F19] p-3 rounded-xl border border-[#1C2638] text-[11px] text-slate-400 space-y-1">
        <p className="font-bold text-amber-300">Demo Accounts Available:</p>
        <div className="flex justify-between">
          <span>Reader: reader@mretyunjai.com</span>
          <button
            onClick={() => {
              setEmail('reader@mretyunjai.com');
              setPassword('reader123');
            }}
            className="text-amber-400 hover:underline"
          >
            Autofill
          </button>
        </div>
        <div className="flex justify-between">
          <span>Admin: admin@mretyunjai.com</span>
          <button
            onClick={() => {
              setEmail('admin@mretyunjai.com');
              setPassword('admin123');
            }}
            className="text-amber-400 hover:underline"
          >
            Autofill
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1C2638]">
        Don&apos;t have an account?{' '}
        <Link href={`/auth/signup?redirect=${encodeURIComponent(redirectUrl)}`} className="text-amber-400 font-bold hover:underline">
          Sign up here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-amber-300">Loading form...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
