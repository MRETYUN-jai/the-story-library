'use client';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-page-enter w-full flex-1">
      {children}
    </div>
  );
}
