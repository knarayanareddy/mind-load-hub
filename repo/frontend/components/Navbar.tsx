'use client';

import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold text-xl">CLB</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="hover:text-white text-zinc-400">Dashboard</Link>
            <Link href="/interventions" className="hover:text-white text-zinc-400">Interventions</Link>
            <Link href="/alerts" className="hover:text-white text-zinc-400">Alerts</Link>
            <Link href="/settings" className="hover:text-white text-zinc-400">Settings</Link>
          </div>
        </div>
        <div className="text-sm text-zinc-400">Team • 12 members</div>
      </div>
    </nav>
  );
}
