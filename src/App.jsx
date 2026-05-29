import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import History from './pages/History';
import Guide from './pages/Guide';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Layout from './components/Layout';
import { supabase } from './lib/supabase';
import { isGuestSession, startGuestSession, endGuestSession } from './lib/guestStorage';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  const [session, setSession] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // 구글 로그인 세션이 있으면 게스트 모드 해제
      if (session) {
        setIsGuest(false);
        endGuestSession();
      } else {
        setIsGuest(isGuestSession());
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsGuest(false);
        endGuestSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGuestStart = () => {
    startGuestSession();
    setIsGuest(true);
  };

  const handleGuestEnd = () => {
    endGuestSession();
    setIsGuest(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isLoggedIn = !!session;
  const hasAccess = isLoggedIn || isGuest;

  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Layout isLoggedIn={isLoggedIn} isGuest={isGuest} hasAccess={hasAccess} />}>
          <Route index element={
            hasAccess
              ? <Dashboard session={session} isGuest={isGuest} />
              : <Navigate to="/onboarding" replace />
          } />
          <Route path="onboarding" element={
            <Onboarding session={session} onGuestStart={handleGuestStart} />
          } />
          <Route path="history" element={
            hasAccess
              ? <History session={session} isGuest={isGuest} />
              : <Navigate to="/onboarding" replace />
          } />
          <Route path="guide" element={<Guide />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="settings" element={
            hasAccess
              ? <Settings session={session} isGuest={isGuest} onGuestEnd={handleGuestEnd} />
              : <Navigate to="/onboarding" replace />
          } />
        </Route>
      </Routes>
    </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
