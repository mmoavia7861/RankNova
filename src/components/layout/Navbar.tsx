import React, { useState } from 'react';
import { User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { auth, isUserAdmin } from '../../lib/firebase';
import { googleWorkspaceSignIn } from '../../lib/workspace';
import { User, signOut } from 'firebase/auth';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, currentUser }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await googleWorkspaceSignIn();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const navLinks = [
    { name: 'SEO Audit', path: '/tools/seo-audit' },
    { name: 'Meta & SERP', path: '/tools/meta-tag-generator' },
    { name: 'Schema JSON-LD', path: '/tools/schema-generator' },
    { name: 'Guides', path: '/guides' },
  ];

  const isAdmin = currentUser && isUserAdmin(currentUser.email);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 text-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { onNavigate('/'); setMobileMenuOpen(false); }}
              className="flex items-center gap-3 text-left focus:outline-none group cursor-pointer"
              aria-label="RankNova Home"
            >
              <img
                src="/assets/aistudio/RankNova_Growth_Analytics_Logo_037f0c19.png"
                alt="RankNova Logo"
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
            <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
              SEO Suite
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const active = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
            {isAdmin && (
              <button
                onClick={() => onNavigate('/admin')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  currentPath === '/admin'
                    ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-xs'
                    : 'text-amber-700 hover:bg-amber-50/80'
                }`}
              >
                Admin CMS
              </button>
            )}
          </nav>

          {/* User / Workspace Actions */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-slate-700 font-medium max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full font-mono font-medium">
                  Connected
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-rose-600 ml-1 p-0.5 transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs border border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                onNavigate(link.path);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                currentPath === link.path
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {link.name}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('/admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-50"
            >
              Admin CMS
            </button>
          )}

          <div className="pt-3 border-t border-slate-200">
            {currentUser ? (
              <div className="flex items-center justify-between py-2 text-sm text-slate-700">
                <span className="truncate">{currentUser.displayName || currentUser.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-rose-600 text-xs font-semibold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold py-2 rounded-xl shadow-xs"
              >
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
