'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Feather, Mail, Lock, User, ArrowRight, CheckCircle2, ShieldAlert, KeyRound, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramVerifyEmail = searchParams.get('verifyEmail');

  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-switch to verify if directed from login with unverified email
  useEffect(() => {
    if (paramVerifyEmail && GMAIL_REGEX.test(paramVerifyEmail)) {
      setFormData((prev) => ({ ...prev, email: paramVerifyEmail }));
      setStep('verify');
    }
  }, [paramVerifyEmail]);

  // Cooldown timer for resend code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Handle registration submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = formData.email.toLowerCase().trim();

    // Strict Gmail check
    if (!GMAIL_REGEX.test(cleanEmail)) {
      setError('Please enter a valid personal Gmail address ending in @gmail.com.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: cleanEmail,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to initiate account registration.');
        setLoading(false);
        return;
      }

      // Transition to verification step
      setStep('verify');
      setResendCooldown(30);
      setSuccessMessage('A 6-digit verification code has been sent directly to your Gmail inbox.');
      setLoading(false);
    } catch (err) {
      setError('Network error initiating registration.');
      setLoading(false);
    }
  };

  // STEP 2: Handle 6-digit code verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
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
        setError(data.error || 'Invalid verification code. Please check your Gmail and try again.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Gmail verified successfully! Entering StoryVault homepage...');
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError('Network error verifying code.');
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
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
      setSuccessMessage('A fresh 6-digit verification code has been sent to your Gmail inbox.');
      setLoading(false);
    } catch (err) {
      setError('Network error resending verification code.');
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
            {step === 'register' ? (
              <Feather className="w-6 h-6 text-rose-400" />
            ) : (
              <KeyRound className="w-6 h-6 text-rose-400" />
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100 tracking-tight">
            {step === 'register' ? 'REGISTER WITH GMAIL' : 'VERIFY GMAIL ID'}
          </h1>
          <p className="text-xs text-rose-200/90 font-serif italic">
            {step === 'register'
              ? 'Register with your verified Gmail ID to purchase & read books'
              : `Enter the 6-digit verification code for ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 text-center flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: REGISTRATION FORM */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs relative z-10">
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
                  placeholder="Mretyun Reader"
                  className="w-full bg-[#080C14] border border-[#283652] focus:border-rose-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold uppercase tracking-wider block">
                  Gmail Address
                </label>
                <span className="text-[10px] text-rose-400 font-medium">@gmail.com required</span>
              </div>
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
              <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1">
                Choose Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Any secure password (min 6 characters)"
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
              {loading ? 'Validating Gmail...' : 'CONTINUE & VERIFY GMAIL'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION CODE FORM */}
        {step === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-5 text-xs relative z-10">
            
            {/* Gmail Check Prompt */}
            <div className="bg-[#141B2D]/80 border border-[#283652] rounded-2xl p-4 text-center space-y-1.5">
              <p className="text-xs text-slate-300">
                We have sent a 6-digit verification code to:
              </p>
              <p className="text-sm font-semibold text-rose-300 font-mono">
                {formData.email}
              </p>
              <p className="text-[11px] text-slate-400">
                Please check your Gmail inbox (or Spam folder) and enter the code below to activate your account.
              </p>
            </div>

            <div>
              <label className="text-slate-300 font-bold uppercase tracking-wider block mb-1 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full bg-[#080C14] border-2 border-rose-500/60 focus:border-rose-400 rounded-2xl py-3.5 text-center text-2xl font-mono tracking-widest text-rose-100 placeholder-slate-700 focus:outline-none transition-all shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-40"
            >
              {loading ? 'Verifying Gmail...' : 'VERIFY & ENTER STORYVAULT'}
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1C2638]">
              <button
                type="button"
                onClick={() => {
                  setStep('register');
                  setError('');
                }}
                className="text-slate-400 hover:text-rose-300 transition-colors"
              >
                ← Edit Gmail Address
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || loading}
                className="text-rose-400 hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1C2638] relative z-10">
          Already have a verified account?{' '}
          <Link href="/auth/login" className="text-rose-400 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080C14] flex items-center justify-center text-xs text-rose-300">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}