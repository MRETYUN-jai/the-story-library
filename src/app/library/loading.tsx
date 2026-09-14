export default function LibraryLoading() {
  return (
    <div className="py-8 sm:py-12 animate-gentle-fade">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* HEADER SKELETON */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#1E293E]/60">
          <div className="space-y-3">
            <div className="w-44 h-5 rounded-full bg-rose-500/10 border border-rose-500/20 animate-pulse" />
            <div className="w-72 sm:w-96 h-9 rounded-2xl bg-[#0E1526] border border-[#1E293E] animate-pulse" />
            <div className="w-56 h-4 rounded-lg bg-slate-800/60 animate-pulse" />
          </div>

          <div className="flex items-center gap-2 bg-[#080C14]/90 p-1.5 rounded-2xl border border-[#1A2336]">
            <div className="w-32 h-8 rounded-xl bg-[#151D2F] animate-pulse" />
            <div className="w-32 h-8 rounded-xl bg-[#0E1526] animate-pulse" />
          </div>
        </div>

        {/* STATS OVERVIEW SKELETON */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0E1422]/80 border border-[#1E293E] rounded-2xl p-5 flex items-center gap-4 animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-800/50" />
              <div className="space-y-2 flex-1">
                <div className="w-20 h-3 bg-slate-800/80 rounded" />
                <div className="w-12 h-6 bg-slate-700/80 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* HERO BANNER SKELETON */}
        <div className="bg-[#0E1422]/80 border border-[#1E293E] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 animate-pulse">
          <div className="w-28 sm:w-36 aspect-[2/3] bg-slate-800/80 rounded-xl border border-slate-700/40 shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <div className="w-36 h-5 bg-rose-500/10 rounded-full" />
            <div className="w-3/4 h-8 bg-slate-800 rounded-xl" />
            <div className="w-full h-3 bg-slate-800 rounded-full" />
            <div className="w-48 h-10 bg-rose-600/20 rounded-xl border border-rose-500/20" />
          </div>
        </div>

        {/* BOOKSHELF SKELETON */}
        <div className="space-y-4">
          <div className="w-48 h-6 bg-slate-800/80 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#0B101C] border border-[#1E293E] rounded-2xl p-4 space-y-3 animate-pulse"
              >
                <div className="w-full aspect-[2/3] bg-slate-800/60 rounded-xl" />
                <div className="w-3/4 h-4 bg-slate-800 rounded" />
                <div className="w-1/2 h-3 bg-slate-800/50 rounded" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
