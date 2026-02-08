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
  { href: '/automation', label: 'Automation', icon: '🤖' },
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
      <nav className="no-print hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col z-50" style={{ backgroundColor: 'var(--navy-900)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--navy-700)' }}>
          <h1 className="text-xl font-bold text-white">📦 iHaul iMove</h1>
          <p className="text-sm font-medium" style={{ color: 'var(--gold-400)' }}>Box Drop CRM</p>
        </div>
        <div className="flex-1 py-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={pathname === link.href ? { backgroundColor: 'var(--orange-500)' } : {}}
              onMouseEnter={(e) => { if (pathname !== link.href) e.currentTarget.style.backgroundColor = 'var(--navy-800)' }}
              onMouseLeave={(e) => { if (pathname !== link.href) e.currentTarget.style.backgroundColor = '' }}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="p-4 text-gray-400 hover:text-white text-sm text-left"
          style={{ borderTop: '1px solid var(--navy-700)' }}
        >
          🚪 Sign Out
        </button>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 flex justify-around z-50 safe-area-bottom" style={{ backgroundColor: 'var(--navy-900)' }}>
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
