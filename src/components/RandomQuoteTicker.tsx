'use client';

import { useState, useEffect } from 'react';
import { Quote, Sparkles } from 'lucide-react';

interface LiteraryQuote {
  quote: string;
  source: string;
}

const LITERARY_QUOTES: LiteraryQuote[] = [
  {
    quote: 'Rain makes you remember everything you tried to hide under the sun.',
    source: 'Can Love Survive?',
  },
  {
    quote: 'Sometimes holding on hurts infinitely more than walking away with your dignity intact.',
    source: 'Not Like This',
  },
  {
    quote: 'If love was meant to survive, time was never the enemy—it was only the test.',
    source: 'Only If It Waits',
  },
  {
    quote: 'We write the longest letters to the people who will never read them.',
    source: 'The Letters We Never Sent',
  },
  {
    quote: 'The hardest part of moving on is realizing that silence is also an answer.',
    source: 'Can Love Survive?',
  },
  {
    quote: 'You cannot pour your whole heart into someone whose hands are already closed.',
    source: 'Not Like This',
  },
  {
    quote: 'Some people aren’t meant to stay in your life; they are only meant to awaken your heart.',
    source: 'Where Rain Meets The River',
  },
  {
    quote: 'Midnight does not create your overthinking; it simply strips away the noise of the day.',
    source: 'The Letters We Never Sent',
  },
  {
    quote: 'Perhaps true love is not about never parting, but knowing you would still choose each other across lifetimes.',
    source: 'Only If It Waits',
  },
  {
    quote: 'In the end, we only regret the words we choked back because we were too afraid to appear vulnerable.',
    source: 'The Letters We Never Sent',
  },
  {
    quote: 'Every raindrop against the glass is an echo of a conversation we never got to finish.',
    source: 'Can Love Survive?',
  },
  {
    quote: 'Forgiveness is not pretending the wound never happened; it is choosing to let the light shine through the scar.',
    source: 'Only If It Waits',
  },
  {
    quote: 'There is a sacred quiet in loving someone from a distance where they can no longer hurt you.',
    source: 'Not Like This',
  },
  {
    quote: 'Memories are warm until you realize you are feeling them alone in the cold.',
    source: 'Where Rain Meets The River',
  },
];

export default function RandomQuoteTicker() {
  const [currentQuote, setCurrentQuote] = useState<LiteraryQuote>(LITERARY_QUOTES[0]);
  const [fade, setFade] = useState(true);

  // Pick a random quote on every page load / refresh
  useEffect(() => {
    // Avoid picking the exact same first quote on refresh
    const randomIndex = Math.floor(Math.random() * LITERARY_QUOTES.length);
    setCurrentQuote(LITERARY_QUOTES[randomIndex]);
  }, []);

  const handleNextQuote = () => {
    setFade(false);
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * LITERARY_QUOTES.length);
      while (LITERARY_QUOTES[nextIndex].quote === currentQuote.quote && LITERARY_QUOTES.length > 1) {
        nextIndex = Math.floor(Math.random() * LITERARY_QUOTES.length);
      }
      setCurrentQuote(LITERARY_QUOTES[nextIndex]);
      setFade(true);
    }, 200);
  };

  return (
    <section className="bg-[#060910]/40 backdrop-blur-xl border-b border-rose-500/15 py-7 px-4 sm:px-6 lg:px-8 relative group shadow-sm">
      <div
        onClick={handleNextQuote}
        title="Click to discover another quote"
        className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center cursor-pointer select-none transition-all"
      >
        <div className="flex items-center gap-3">
          <Quote className="w-5 h-5 text-rose-400/60 shrink-0 group-hover:text-rose-400 group-hover:scale-110 transition-all" />
          <p
            className={`font-serif italic text-sm sm:text-base text-rose-200/90 transition-opacity duration-300 ${
              fade ? 'opacity-100' : 'opacity-0'
            }`}
          >
            &ldquo;{currentQuote.quote}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs text-rose-400 font-mono tracking-wider transition-opacity duration-300 ${
              fade ? 'opacity-100' : 'opacity-0'
            }`}
          >
            — Mretyun Jai B
          </span>
          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
            <Sparkles className="w-3 h-3 text-rose-400/70" />
            <span>tap to shuffle</span>
          </span>
        </div>
      </div>
    </section>
  );
}
