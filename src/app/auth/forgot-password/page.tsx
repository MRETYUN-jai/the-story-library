'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Feather, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [demoResetToken, setDemoResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }

      setMessage(data.message);
      if (data.demoResetToken) {
        setDemoResetToken(data.demoResetToken);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-[#121826] border border-[#232F47] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 border border-amber-500/30 mx-auto">
            <Feather className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-amber-100">
            FORGOT PASSWORD
          </h1>
          <p className="text-xs text-slate-400">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {message ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-xs text-emerald-200">{message}</p>

            {demoResetToken && (
              <div className="pt-2 text-left bg-[#0B0F19] p-3 rounded-xl border border-[#1C2638] text-[11px]">
                <span className="text-amber-400 font-bold block mb-1">Demo Password Reset Link:</span>
                <Link
                  href={`/auth/reset-password?token=${demoResetToken}`}
                  className="text-amber-300 underline break-all hover:text-amber-200"
                >
                  Click here to set new password →
                </Link>
              </div>
            )}
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38F2D] hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Sending Request...</span>
              ) : (
                <>
                  <span>SEND RESET INSTRUCTIONS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1C2638]">
          Remembered your password?{' '}
          <Link href="/auth/login" className="text-amber-400 font-bold hover:underline">
            Back to login
          </Link>
        </div>

      </div>

    </div>
  );
}
