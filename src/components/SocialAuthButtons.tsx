'use client';

import { useState } from 'react';
import { Mail, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SocialAuthButtonsProps {
  redirectUrl?: string;
}

export default function SocialAuthButtons({ redirectUrl = '/' }: SocialAuthButtonsProps) {
  const router = useRouter();
  const [activeProvider, setActiveProvider] = useState<'google' | 'microsoft' | 'apple' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSocialClick = (provider: 'google' | 'microsoft' | 'apple') => {
    setActiveProvider(provider);
    setError('');
    // Pre-fill placeholder
    if (provider === 'google') setEmailInput('');
    else if (provider === 'microsoft') setEmailInput('');
    else if (provider === 'apple') setEmailInput('');
  };

  const handleCompleteSocialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: activeProvider,
          email: emailInput.trim(),
          name: nameInput.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Social sign in failed.');
        setLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setError('Network error during social authentication.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Provider Buttons */}
      <div className="space-y-2.5">
        
        {/* GOOGLE */}
        <button
          type="button"
          onClick={() => handleSocialClick('google')}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/50 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* MICROSOFT */}
        <button
          type="button"
          onClick={() => handleSocialClick('microsoft')}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/50 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          <span>Continue with Microsoft</span>
        </button>

        {/* APPLE */}
        <button
          type="button"
          onClick={() => handleSocialClick('apple')}
          className="w-full py-2.5 px-4 rounded-xl bg-[#0E1422] border border-[#1E293E] hover:border-rose-500/50 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow"
        >
          <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.38-6.08-3.41-2.77-7.27-7.44-11.57-14.02-6.58-10.05-11.66-20.76-15.24-32.14-3.58-11.39-5.37-22.38-5.37-32.99 0-15.84 4.09-28.79 12.27-38.86 8.18-10.07 18.25-15.18 30.22-15.33 4.47 0 9.53 1.15 15.18 3.44 5.65 2.3 9.4 3.44 11.24 3.44 1.45 0 5.37-1.22 11.77-3.66 6.39-2.44 11.83-3.54 16.32-3.3 11.44.62 20.9 4.8 28.37 12.54-10.15 6.14-15.11 14.76-14.88 25.86.23 8.7 3.6 16.03 10.12 21.99 6.52 5.96 14.36 9.38 23.53 10.25-2.3 6.94-5.35 14.07-9.15 21.39zM119.22 31.81c0-7.39 2.7-14.41 8.1-21.06 5.4-6.65 12.21-10.75 20.43-12.3 1.08 7.39-1.29 14.46-7.1 21.2-5.81 6.74-12.67 10.74-20.58 11.99-.23-.62-.46-1.23-.46-1.83z" />
          </svg>
          <span>Continue with Apple</span>
        </button>

      </div>

      {/* MODAL FOR SOCIAL EMAIL CONFIRMATION */}
      {activeProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0E1422] border border-[#1E293E] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100 font-sans">
            
            <button
              onClick={() => setActiveProvider(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 mb-5">
              <span className="text-xs uppercase font-bold tracking-widest text-rose-400">
                {activeProvider.toUpperCase()} AUTHENTICATION
              </span>
              <h3 className="font-serif text-lg font-bold text-rose-100">
                Confirm Your Original Primary Email
              </h3>
              <p className="text-xs text-slate-400">
                This email will receive official reading notifications, order receipts, and account access.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleCompleteSocialAuth} className="space-y-4 text-xs">
              
              <div>
                <label className="text-slate-300 font-bold block mb-1">Your Full Name (Optional)</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ananya Sharma"
                  className="w-full bg-[#080C14] border border-[#283652] rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Your Primary {activeProvider.toUpperCase()} Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveProvider(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#283652] text-slate-300 font-semibold"
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold flex items-center justify-center gap-1.5 shadow"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
