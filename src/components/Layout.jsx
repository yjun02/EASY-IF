import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Settings as SettingsIcon, Calendar, BookOpen } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row max-w-[800px] w-full mx-auto shadow-sm">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 p-6">
        <div className="mb-10">
          <h1 className="text-xl font-bold text-gray-900">간단하게 간단하자</h1>
          <p className="text-sm text-gray-500">Easy IF</p>
        </div>
        <nav className="flex flex-col gap-4">
          <Link to="/" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname === '/' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Home size={20} />
            <span>대시보드</span>
          </Link>
          <Link to="/history" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname === '/history' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Calendar size={20} />
            <span>기록</span>
          </Link>
          <Link to="/guide" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname === '/guide' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BookOpen size={20} />
            <span>가이드</span>
          </Link>
          <Link to="/settings" className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${location.pathname === '/settings' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <SettingsIcon size={20} />
            <span>설정</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 w-full mx-auto bg-white min-h-screen relative pb-16 md:pb-0">
        <Outlet />
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-16 px-4 z-50">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-green-600' : 'text-gray-400'}`}>
          <Home size={24} />
          <span className="text-[10px] font-medium">홈</span>
        </Link>
        <Link to="/history" className={`flex flex-col items-center gap-1 ${location.pathname === '/history' ? 'text-green-600' : 'text-gray-400'}`}>
          <Calendar size={24} />
          <span className="text-[10px] font-medium">기록</span>
        </Link>
        <Link to="/guide" className={`flex flex-col items-center gap-1 ${location.pathname === '/guide' ? 'text-green-600' : 'text-gray-400'}`}>
          <BookOpen size={24} />
          <span className="text-[10px] font-medium">가이드</span>
        </Link>
        <Link to="/settings" className={`flex flex-col items-center gap-1 ${location.pathname === '/settings' ? 'text-green-600' : 'text-gray-400'}`}>
          <SettingsIcon size={24} />
          <span className="text-[10px] font-medium">설정</span>
        </Link>
      </nav>
    </div>
  );
}
