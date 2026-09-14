'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Feather, Mail, Lock, ArrowRight, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [otpCode, setOtpCode] = useState('');
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Verify Email & Password -> Request OTP or Passcode
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = formData.email.toLowerCase().trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
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

      if (data.requiresOtp) {
        setIsAdminLogin(!!data.isAdmin);
        setStep('otp');
        setResendCooldown(data.isAdmin ? 0 : 30);
        setSuccessMessage(
          data.isAdmin
            ? 'Enter your 6-digit Admin Security Passcode.'
            : 'A 6-digit verification code has been sent directly to your Gmail inbox.'
        );
      } else {
        // Direct redirect if OTP not required
        const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
        const targetUrl = redirectParam || (data.user?.role === 'ADMIN' ? '/admin' : '/');

        setSuccessMessage(data.user?.role === 'ADMIN' ? 'Admin verified! Entering dashboard...' : 'Logging in... Entering StoryVault...');
        setTimeout(() => {
          router.push(targetUrl);
          router.refresh();
        }, 500);
      }
    } catch (err) {
      setError('Network error during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify 6-digit OTP -> Enter Homepage
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification OTP.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          code: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid or expired OTP code. Please try again.');
        setLoading(false);
        return;
      }

      const redirectParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null;
      const targetUrl = redirectParam || (data.user?.role === 'ADMIN' ? '/admin' : '/');

      setSuccessMessage('OTP verified successfully! Entering StoryVault...');
      setTimeout(() => {
        router.push(targetUrl);
        router.refresh();
      }, 700);
    } catch (err) {
      setError('Network error verifying OTP.');
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code.');
        setLoading(false);
        return;
      }

      setResendCooldown(45);
      setSuccessMessage('A fresh 6-digit OTP has been sent directly to your Gmail inbox.');
    } catch (err) {
      setError('Network error resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full bg-[#0E1422] border border-[#1E293E] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-300 shadow-xl shadow-rose-500/10">
            {step === 'login' ? (
              <Feather className="w-6 h-6 text-rose-400" />
            ) : (
              <KeyRound className="w-6 h-6 text-rose-400" />
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100 tracking-tight">
            {step === 'login'
              ? 'WELCOME BACK'
              : isAdminLogin
              ? 'ENTER ADMIN PASSCODE'
              : 'ENTER VERIFICATION OTP'}
          </h1>
          <p className="text-xs text-rose-200/90 font-serif italic">
            {step === 'login'
              ? 'Log in to access your digital library & continue reading'
              : isAdminLogin
              ? 'Enter the 6-digit Admin Security Passcode'
              : `Enter the 6-digit code sent to ${formData.email}`}
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

        {/* Gmail Check Prompt / Admin Passcode Prompt */}
        {step === 'otp' && (
          <div className="p-4 rounded-2xl bg-[#141B2D]/80 border border-[#283652] text-center space-y-1.5 animate-fade-in">
            {isAdminLogin ? (
              <>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Admin Passcode Verification
                </span>
                <p className="text-[11px] text-slate-300">
                  No email OTP required for Administrator. Enter your 6-digit Master Passcode below.
                </p>
              </>
            ) : (
              <>
                <span className="text-[11px] font-medium text-slate-300">
                  A 6-digit verification OTP has been dispatched to:
                </span>
                <div className="font-mono text-sm font-semibold text-rose-300">
                  {formData.email}
                </div>
                <p className="text-[11px] text-slate-400">
                  Please check your Gmail inbox (or Spam folder) and enter the code below to log in.
                </p>
              </>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* STEP 1: CREDENTIALS FORM */}
        {/* ===================================================================== */}
        {step === 'login' ? (
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
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                />
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
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>LOG IN WITH OTP / PASSCODE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ===================================================================== */
          /* STEP 2: 6-DIGIT OTP / ADMIN PASSCODE VERIFICATION FORM */
          /* ===================================================================== */
          <form onSubmit={handleOtpSubmit} className="space-y-5 text-xs relative z-10">
            <div>
              <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1 text-center">
                {isAdminLogin ? 'Enter 6-Digit Admin Passcode' : 'Enter 6-Digit OTP Code'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full bg-[#080C14] border-2 border-rose-500/40 focus:border-rose-500 rounded-2xl py-3.5 px-4 text-center font-mono text-2xl font-bold tracking-[0.4em] text-rose-200 placeholder-slate-700 focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                {isAdminLogin ? (
                  <span className="text-amber-400 font-medium">Author Security Authorization</span>
                ) : (
                  <>Sent to: <span className="font-semibold text-rose-300">{formData.email}</span></>
                )}
              </p>
            </div>

            {/* SUBMIT OTP / PASSCODE BUTTON */}
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-xl shadow-rose-500/25 transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAdminLogin ? 'VERIFYING PASSCODE...' : 'VERIFYING OTP...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAdminLogin ? 'VERIFY PASSCODE & ENTER' : 'VERIFY & ENTER HOMEPAGE'}</span>
                </>
              )}
            </button>

            {/* Resend & Change Account Options */}
            <div className="flex items-center justify-between pt-2 text-xs border-t border-[#1C2638]">
              {!isAdminLogin ? (
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-rose-400 hover:text-rose-300 font-semibold disabled:text-slate-500 transition-colors cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP Code'}
                </button>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  Author Passcode Security
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setError('');
                  setSuccessMessage('');
                  setIsAdminLogin(false);
                }}
                className="text-slate-400 hover:text-rose-300 underline font-semibold transition-colors cursor-pointer"
              >
                Change Email
              </button>
            </div>
          </form>
        )}



        {/* Footer Link */}
        <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1C2638] relative z-10">
          Don&apos;t have an account yet?{' '}
          <Link href="/auth/signup" className="text-rose-400 font-bold hover:underline">
            Create Account with Gmail
          </Link>
        </div>

      </div>
    </div>
  );
}