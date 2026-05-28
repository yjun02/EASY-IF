import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import History from './pages/History';
import Guide from './pages/Guide';
import Layout from './components/Layout';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            session ? <Dashboard session={session} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="onboarding" element={<Onboarding session={session} />} />
          <Route path="history" element={
            session ? <History session={session} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="guide" element={<Guide />} />
          <Route path="settings" element={
            session ? <Settings session={session} /> : <Navigate to="/onboarding" replace />
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
