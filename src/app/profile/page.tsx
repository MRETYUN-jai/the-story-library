'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Compass,
  Check,
  Save,
  Loader2,
  Calendar,
  Mail,
  BadgeCheck,
  Image as ImageIcon,
  BookMarked,
  ArrowRight,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ProfileStats {
  purchasedCount: number;
  inProgressCount: number;
}

interface PurchasedBook {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  genre: string;
}

const PRESET_AVATARS = [
  { id: 'scholar', name: 'The Literary Scholar', path: '/avatars/scholar.svg' },
  { id: 'storyteller', name: 'The Mystic Storyteller', path: '/avatars/storyteller.svg' },
  { id: 'poet', name: 'The Midnight Poet', path: '/avatars/poet.svg' },
  { id: 'quill', name: 'The Golden Quill', path: '/avatars/quill.svg' },
  { id: 'wanderer', name: 'The Cosmic Wanderer', path: '/avatars/wanderer.svg' },
  { id: 'phoenix', name: 'The Reborn Phoenix', path: '/avatars/phoenix.svg' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ purchasedCount: 0, inProgressCount: 0 });
  const [purchasedBooks, setPurchasedBooks] = useState<PurchasedBook[]>([]);

  // Form State
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/scholar.svg');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  // Status message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile');
      if (res.status === 401) {
        router.push('/auth/login?redirect=/profile');
        return;
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setUsername(data.user.name || '');
        setNickname(data.user.nickname || '');
        const currentAvatar = data.user.avatar || '/avatars/scholar.svg';
        setSelectedAvatar(currentAvatar);

        // Check if avatar is custom url
        const isPreset = PRESET_AVATARS.some((p) => p.path === currentAvatar);
        if (!isPreset && currentAvatar.startsWith('http')) {
          setCustomAvatarUrl(currentAvatar);
          setUseCustomUrl(true);
        }

        setStats(data.stats || { purchasedCount: 0, inProgressCount: 0 });
        setPurchasedBooks(data.purchases || []);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!username.trim() || username.trim().length < 2) {
      setFeedback({ type: 'error', message: 'Username must be at least 2 characters long' });
      return;
    }

    try {
      setSaving(true);
      const finalAvatar = useCustomUrl && customAvatarUrl.trim() ? customAvatarUrl.trim() : selectedAvatar;

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username.trim(),
          nickname: nickname.trim(),
          avatar: finalAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user);
      setFeedback({ type: 'success', message: 'Your profile has been updated successfully!' });
      
      // Trigger a soft refresh to update Navbar avatar immediately
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  // Delete Account States & Handler
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account deletion.');
      return;
    }

    try {
      setDeleting(true);
      setDeleteError('');

      const res = await fetch('/api/user/profile', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Hard redirect to clear all frontend state and immediately show guest navbar
      window.location.href = '/?accountDeleted=true';
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred while deleting your account.');
      setDeleting(false);
    }
  };

  const activeAvatarPreview = useCustomUrl && customAvatarUrl.trim() ? customAvatarUrl.trim() : selectedAvatar;

  return (
    <div className="py-6 sm:py-10">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4 text-rose-300">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Reader Profile...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-sm text-slate-400">Please log in to view your profile.</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30"
            >
              Log In to StoryVault
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* HERO PROFILE CARD */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E1526] via-[#0B101C] to-[#080C14] border border-[#1E293E] p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                
                {/* Active Avatar Frame */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 shadow-xl shadow-rose-500/25">
                    <img
                      src={activeAvatarPreview}
                      alt={user.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatars/scholar.svg';
                      }}
                      className="w-full h-full object-cover rounded-[22px] bg-[#0A0E1A]"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-xl shadow-lg border-2 border-[#0E1526]">
                    <ShieldCheck className="w-4 h-4 text-emerald-950" />
                  </div>
                </div>

                {/* User Info Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-rose-100 tracking-tight">
                      {user.nickname ? user.nickname : user.name}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3 text-rose-400" />
                      {user.role === 'ADMIN' ? 'AUTHOR & ADMIN' : 'VERIFIED READER'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-1 gap-x-4 text-xs text-slate-400 font-sans">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-rose-400" />
                      <span>Username: <strong className="text-slate-200">@{user.name}</strong></span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300/90">{user.email}</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 pt-1">
                    Your personal reading profile for all literary editions and digital story branches on StoryVault.
                  </p>
                </div>
              </div>

              {/* STATS TILES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-[#1E293E]/70 relative z-10">
                <div className="bg-[#0B101C]/80 border border-[#1A2336] p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-rose-100">{stats.purchasedCount}</p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Books Owned</p>
                  </div>
                </div>

                <div className="bg-[#0B101C]/80 border border-[#1A2336] p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-100">{stats.inProgressCount}</p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">In Progress</p>
                  </div>
                </div>

                <div className="bg-[#0B101C]/80 border border-[#1A2336] p-3.5 rounded-2xl flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-300">Protected DRM</p>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Verified Account</p>
                  </div>
                </div>
              </div>

            </div>

            {/* EDIT PROFILE FORM & AVATAR PICKER */}
            <form onSubmit={handleSaveProfile} className="space-y-8">
              
              {feedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <Sparkles className="w-4 h-4 shrink-0" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* 1. CHOOSE YOUR AVATAR */}
              <div className="bg-[#0B101C] border border-[#1E293E] rounded-3xl p-6 sm:p-8 space-y-5">
                <div>
                  <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-rose-400" />
                    Choose Your Avatar
                  </h2>
                  <p className="text-xs text-slate-400 pt-1">
                    Select a curated literary avatar that represents your reading identity.
                  </p>
                </div>

                {/* Preset Avatars Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                  {PRESET_AVATARS.map((preset) => {
                    const isSelected = !useCustomUrl && selectedAvatar === preset.path;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setUseCustomUrl(false);
                          setSelectedAvatar(preset.path);
                        }}
                        className={`group p-3 rounded-2xl border transition-all duration-200 flex flex-col items-center gap-2 text-center relative ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 shadow-lg shadow-rose-500/20 scale-[1.03]'
                            : 'bg-[#0E1422] border-[#1A2336] hover:border-rose-500/50 hover:bg-[#131A2C]'
                        }`}
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden p-1">
                          <img
                            src={preset.path}
                            alt={preset.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 group-hover:text-rose-200 line-clamp-1">
                          {preset.name.replace('The ', '')}
                        </span>
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Avatar URL Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setUseCustomUrl(!useCustomUrl)}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{useCustomUrl ? 'Use curated presets instead' : 'Or use a custom avatar image link'}</span>
                  </button>

                  {useCustomUrl && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="url"
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        placeholder="https://example.com/my-avatar.png"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0E1422] border border-[#222E44] text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500">
                        Paste a direct link to any JPG, PNG, or SVG image.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. USERNAME & NICKNAME DETAILS */}
              <div className="bg-[#0B101C] border border-[#1E293E] rounded-3xl p-6 sm:p-8 space-y-5">
                <div>
                  <h2 className="font-serif text-xl font-bold text-rose-100 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-rose-400" />
                    Reader Identity & Details
                  </h2>
                  <p className="text-xs text-slate-400 pt-1">
                    Maintain your registered account username and custom reader nickname.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Account Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <span>Account Username</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your account username"
                      className="w-full px-4 py-3 rounded-xl bg-[#0E1422] border border-[#222E44] text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors font-medium"
                    />
                    <p className="text-[11px] text-slate-500">
                      Your primary identity on StoryVault.
                    </p>
                  </div>

                  {/* Reader Nickname */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <span>Reader Nickname</span>
                      <span className="text-slate-500 text-[10px] font-normal normal-case">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. Starlight Reader, Mretyun"
                      className="w-full px-4 py-3 rounded-xl bg-[#0E1422] border border-[#222E44] text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors font-medium"
                    />
                    <p className="text-[11px] text-slate-500">
                      Displayed proudly on reading milestones and bookmarks.
                    </p>
                  </div>

                  {/* Email Address (Immutable / Verified) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <span>Registered Gmail</span>
                      <span className="text-emerald-400 text-[10px] font-bold">(Verified)</span>
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-[#1A2336] text-xs text-slate-400 flex items-center justify-between cursor-not-allowed select-none">
                      <span>{user.email}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Verified email used for personal DRM watermarking.
                    </p>
                  </div>

                  {/* Account Role */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Account Status
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl bg-[#070A12] border border-[#1A2336] text-xs text-slate-300 flex items-center justify-between cursor-not-allowed select-none">
                      <span className="font-semibold text-rose-300">{user.role === 'ADMIN' ? 'Author / Platform Administrator' : 'Verified StoryVault Reader'}</span>
                      <BadgeCheck className="w-4 h-4 text-rose-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Active digital access status.
                    </p>
                  </div>

                </div>
              </div>

              {/* SAVE & ACTIONS ROW */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>

                <div className="flex items-center gap-3">
                  <Link
                    href="/library"
                    prefetch={true}
                    className="px-5 py-2.5 rounded-xl border border-[#222E44] text-slate-400 hover:text-rose-200 hover:border-rose-500/40 text-xs font-bold transition-all"
                  >
                    Cancel
                  </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:brightness-110 text-white font-bold text-xs shadow-xl shadow-rose-500/25 flex items-center gap-2 disabled:opacity-50 transition-all uppercase tracking-wider"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            </form>

            {/* DANGER ZONE: DELETE ACCOUNT */}
            {user.role !== 'ADMIN' && (
              <div className="rounded-3xl border border-rose-950/70 bg-gradient-to-br from-rose-950/25 via-[#0E1018] to-[#0A0D14] p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="font-serif text-lg font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                      <span>Danger Zone</span>
                    </h2>
                    <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                      Permanently delete your StoryVault account. All your purchased books, reading progress, bookmarks, and appearance in reader directories will be completely erased from our database forever.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteConfirmText('');
                      setDeleteError('');
                    }}
                    className="px-5 py-3 rounded-xl border border-rose-500/50 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-rose-950/40 uppercase tracking-wider"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            )}

            {/* QUICK SHORTCUTS TO LIBRARY & STORIES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Link
                href="/library"
                prefetch={true}
                className="group p-5 rounded-2xl bg-[#0B101C] border border-[#1E293E] hover:border-rose-500/50 hover:bg-[#0E1526] transition-all flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-bold text-rose-100 group-hover:text-rose-300 transition-colors flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    Go to My Library
                  </h3>
                  <p className="text-xs text-slate-400">
                    Access your purchased books, digital editions, and reading bookmarks.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
              </Link>

              <Link
                href="/books"
                prefetch={true}
                className="group p-5 rounded-2xl bg-[#0B101C] border border-[#1E293E] hover:border-rose-500/50 hover:bg-[#0E1526] transition-all flex items-center justify-between"
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-sm font-bold text-rose-100 group-hover:text-rose-300 transition-colors flex items-center gap-2">
                    <Compass className="w-4 h-4 text-rose-400" />
                    Browse Stories & Trilogy
                  </h3>
                  <p className="text-xs text-slate-400">
                    Explore new releases, previews, and branching narrative paths.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
              </Link>
            </div>

            {/* DELETE ACCOUNT CONFIRMATION MODAL */}
            {showDeleteModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
                <div className="bg-[#0E1422] border-2 border-rose-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
                  
                  {/* Subtle Red Ambient Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-rose-600/15 blur-2xl pointer-events-none" />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-500/20">
                        <Trash2 className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-rose-100">Delete StoryVault Account?</h3>
                        <p className="text-xs text-rose-300/80">Permanent database erasure</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setShowDeleteModal(false)}
                      className="text-slate-400 hover:text-rose-300 p-1 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2.5 bg-[#080C14] border border-[#1E293E] p-4 rounded-2xl relative z-10">
                    <p className="font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>Warning: This action is permanent!</span>
                    </p>
                    <ul className="space-y-1.5 text-slate-400 list-disc list-inside leading-relaxed">
                      <li>Account <strong className="text-slate-200">@{user?.name}</strong> will be erased from PostgreSQL.</li>
                      <li>Every book you bought (<strong className="text-rose-300">{stats.purchasedCount} book{stats.purchasedCount === 1 ? '' : 's'}</strong>) will be deleted.</li>
                      <li>All reading bookmarks & progress will be wiped.</li>
                      <li>Your name and appearance will vanish from readers lists.</li>
                    </ul>
                  </div>

                  {deleteError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold text-center relative z-10">
                      {deleteError}
                    </div>
                  )}

                  <div className="space-y-2 relative z-10">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                      Type <strong className="text-rose-400 underline">DELETE</strong> below to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl bg-[#080C14] border-2 border-rose-500/50 focus:border-rose-400 text-sm font-mono font-bold text-rose-100 text-center tracking-[0.25em] focus:outline-none transition-all placeholder:text-slate-700"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2 relative z-10">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-3 rounded-xl border border-[#222E44] text-slate-400 hover:text-rose-200 hover:border-rose-500/40 text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={deleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                      onClick={handleDeleteAccount}
                      className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Forever</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
