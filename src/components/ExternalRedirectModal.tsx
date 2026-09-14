'use client';

import { useState } from 'react';
import { ExternalLink, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ExternalRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  editionName: string;
  publisherName: string;
}

export default function ExternalRedirectModal({
  isOpen,
  onClose,
  targetUrl,
  editionName,
  publisherName,
}: ExternalRedirectModalProps) {
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (rememberChoice) {
      localStorage.setItem('skip_external_redirect_modal', 'true');
    }
    onClose();
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in font-sans">
      <div className="bg-[#0E1422]/55 backdrop-blur-3xl border border-white/[0.15] rounded-3xl max-w-md w-full p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-6 text-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.06] to-transparent pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1C2638]/50 transition-all relative z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 border border-rose-500/30 shadow-md">
            <ExternalLink className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-serif text-lg text-rose-100 font-semibold">
              External Publisher Redirect
            </h3>
            <p className="text-xs text-rose-300/80">{editionName}</p>
          </div>
        </div>

        {/* Informational Body */}
        <div className="space-y-3 bg-[#080C14]/40 backdrop-blur-xl p-4 rounded-2xl border border-white/[0.1] text-xs text-slate-300 leading-relaxed relative z-10">
          <p>
            You are leaving <strong className="text-rose-200">StoryVault</strong> to purchase a physical printed copy from our official publishing partner (<strong className="text-rose-300">{publisherName}</strong>).
          </p>
          <p className="text-slate-400 text-[11px]">
            Physical edition printing, shipping, and order fulfillment are handled directly by {publisherName}.
          </p>
        </div>

        {/* Remember Choice Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="rememberRedirect"
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-[#080C14] text-rose-500 focus:ring-rose-500/30"
          />
          <label htmlFor="rememberRedirect" className="text-xs text-slate-400 cursor-pointer">
            Don&apos;t show this confirmation again
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-[#26334D] hover:bg-slate-800/50 text-xs font-semibold text-slate-300 transition-colors"
          >
            CANCEL
          </button>

          <button
            onClick={handleProceed}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:brightness-110 text-xs font-bold text-white shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>PROCEED TO CHECKOUT</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
