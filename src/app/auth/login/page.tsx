'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { Feather, Mail, Lock, ArrowRight, RefreshCw, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Single-Step Login: Verify Email & Password and log in directly
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = formData.email.toLowerCase().trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!formData.password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Direct redirect
      const targetUrl = redirectParam || (data.user?.role === 'ADMIN' ? '/admin' : '/');

      setSuccessMessage(
        data.user?.role === 'ADMIN'
          ? 'Admin verified! Entering dashboard...'
          : 'Login successful! Entering StoryVault...'
      );

      setTimeout(() => {
        router.push(targetUrl);
        router.refresh();
      }, 500);
    } catch (err) {
      setError('Network error during sign in.');
      setLoading(false);
    }
  };

  const signupUrl = redirectParam
    ? `/auth/signup?redirect=${encodeURIComponent(redirectParam)}`
    : '/auth/signup';

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 shadow-xl shadow-rose-500/10">
            <Feather className="w-6 h-6 text-rose-400" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100 tracking-tight">
            WELCOME BACK
          </h1>
          <p className="text-xs text-rose-200/90 font-serif italic">
            Log in to access your digital library & continue reading
          </p>
        </div>

        {/* Notification / Error / Success Banners */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 text-center font-medium animate-fade-in">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 text-center font-medium flex items-center justify-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* CREDENTIALS FORM */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs relative z-10">
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
                placeholder="yourname@gmail.com"
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold uppercase tracking-wider block">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-rose-400 hover:underline text-[11px] font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-11 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 focus:outline-none p-1.5 transition-colors cursor-pointer z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-rose-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>SIGN IN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>



        {/* Footer Link */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1C2638] relative z-10">
          Don&apos;t have an account yet?{' '}
          <Link href={signupUrl} className="text-rose-400 font-bold hover:underline">
            Register / Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center">
        <div className="text-rose-400 font-serif animate-pulse">Loading StoryVault...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}