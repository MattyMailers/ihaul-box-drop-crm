'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/drops', label: 'Box Drops', icon: '📦' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/routes', label: 'Routes', icon: '🚚' },
  { href: '/supplies', label: 'Supplies', icon: '📋' },
  { href: '/followups', label: 'Follow-Ups', icon: '📞' },
  { href: '/realtors', label: 'Realtors', icon: '🏠' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="no-print hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-gray-900 flex-col z-50">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">📦 iHaul iMove</h1>
          <p className="text-orange-400 text-sm font-medium">Box Drop CRM</p>
        </div>
        <div className="flex-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="p-4 text-gray-400 hover:text-white text-sm text-left border-t border-gray-700"
        >
          🚪 Sign Out
        </button>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 flex justify-around z-50 safe-area-bottom">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center py-2 px-3 text-xs ${
              pathname === link.href ? 'text-orange-400' : 'text-gray-400'
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="mt-0.5">{link.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
