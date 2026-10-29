import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { SeoAuditTool } from './components/tools/SeoAudit/SeoAuditTool';
import { MetaGeneratorTool } from './components/tools/MetaGenerator/MetaGeneratorTool';
import { SchemaGeneratorTool } from './components/tools/SchemaGenerator/SchemaGeneratorTool';
import { GuidesPage } from './pages/GuidesPage';
import { GuideDetailPage } from './pages/GuideDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { AdminPage } from './pages/AdminPage';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { trackEvent } from './lib/analytics';

// For project-hosted GitHub Pages, strip the /RankNova prefix when matching routes.
// Cloud Run continues to use the root path as before.
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function getCurrentRoute(): string {
  const pathname = window.location.pathname;
  if (BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(BASE_PATH + '/'))) {
    return pathname.slice(BASE_PATH.length) || '/';
  }
  return pathname;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? getCurrentRoute() : '/'
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Synchronize browser history and route state
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCurrentRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Firestore is accessed only by features that need it.
  // No unauthenticated startup request to a deliberately denied test document.

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', BASE_PATH + path);
      setCurrentPath(path);
      window.scrollTo(0, 0);

      if (path.startsWith('/tools/')) {
        trackEvent('tool_view', { path });
      }
    }
  };

  const renderContent = () => {
    if (currentPath === '/') {
      return <HomePage onNavigate={navigate} />;
    }
    if (currentPath === '/tools/seo-audit') {
      return <SeoAuditTool />;
    }
    if (currentPath === '/tools/meta-tag-generator') {
      return <MetaGeneratorTool />;
    }
    if (currentPath === '/tools/schema-generator') {
      return <SchemaGeneratorTool />;
    }
    if (currentPath === '/guides') {
      return <GuidesPage onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/guides/')) {
      const slug = currentPath.replace('/guides/', '');
      return <GuideDetailPage slug={slug} onNavigate={navigate} />;
    }
    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }
    if (currentPath === '/contact') {
      return <ContactPage />;
    }
    if (currentPath === '/privacy-policy') {
      return <PrivacyPolicyPage />;
    }
    if (currentPath === '/terms') {
      return <TermsPage />;
    }
    if (currentPath === '/disclaimer') {
      return <DisclaimerPage />;
    }
    if (currentPath === '/admin') {
      return <AdminPage />;
    }

    // 404 Fallback
    return (
      <div className="max-w-md mx-auto my-24 p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <h2 className="text-lg font-bold text-slate-700">Page Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested URL does not exist or has been relocated.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          Return to RankNova Home
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans antialiased">
      <Navbar currentPath={currentPath} onNavigate={navigate} currentUser={currentUser} />
      <main className="flex-1">{renderContent()}</main>
      <Footer onNavigate={navigate} />
    </div>
  );
}
