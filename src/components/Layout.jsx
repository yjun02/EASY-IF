import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Settings as SettingsIcon, Calendar, BookOpen, Info, Play } from 'lucide-react';

const FooterContent = () => (
  <div className="text-center md:text-left text-xs text-gray-400 font-medium">
    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
      <span className="text-gray-400">서비스 이용약관 및 개인정보처리방침은 설정에서 확인하실 수 있습니다.</span>
    </div>
    <p>© {new Date().getFullYear()} 간단하게 간단하자: EASY IF</p>
    <p className="mt-1">
      Developed by <a href="https://github.com/yjun02" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600 transition-colors font-bold underline underline-offset-2">yjun02(Github)</a>
    </p>
  </div>
);

export default function Layout({ isLoggedIn, isGuest, hasAccess }) {
  const location = useLocation();
  const showNav = hasAccess; // 로그인 혹은 게스트 모드 진입 후

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row max-w-[960px] w-full mx-auto md:p-4 gap-4 md:items-stretch">
      {/* Desktop Floating Sidebar — 독립된 구역 카드 */}
      <aside className="hidden md:flex flex-col w-56 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm shrink-0 sticky top-4 h-[calc(100vh-32px)]">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">간단하게 간단하자: <span className="text-green-600">EASY IF</span></h1>
        </div>
        
        <nav className="flex flex-col gap-2.5">
          {showNav ? (
            // 로그인 혹은 게스트 모드 진입 성공 후
            <>
              <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Home size={18} />
                <span className="text-sm">대시보드</span>
              </Link>
              <Link to="/history" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/history' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Calendar size={18} />
                <span className="text-sm">기록</span>
              </Link>
              <Link to="/guide" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/guide' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <BookOpen size={18} />
                <span className="text-sm">가이드</span>
              </Link>
              <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/settings' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <SettingsIcon size={18} />
                <span className="text-sm">설정</span>
              </Link>
            </>
          ) : (
            // 로그인/게스트 진입 전 첫 방문자용 메뉴
            <>
              <Link to="/onboarding" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/onboarding' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Play size={18} />
                <span className="text-sm">시작하기</span>
              </Link>
              <Link to="/about" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/about' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <Info size={18} />
                <span className="text-sm">서비스 소개</span>
              </Link>
              <Link to="/guide" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === '/guide' ? 'bg-green-50 text-green-700 font-bold shadow-sm shadow-green-50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <BookOpen size={18} />
                <span className="text-sm">가이드</span>
              </Link>
            </>
          )}
        </nav>
        
        <div className="mt-auto pt-8">
          <FooterContent />
        </div>
      </aside>

      {/* Main Floating Card — 모바일에서는 꽉 차게, PC에서는 둥근 카드로 독립적 플로팅 */}
      <main className="flex-1 w-full mx-auto bg-white md:border md:border-gray-100 md:rounded-3xl md:shadow-sm md:min-h-[calc(100vh-32px)] relative flex flex-col pb-16 md:pb-0">
        {/* Mobile Header — 높이를 줄이고 한 줄로 통합 */}
        <header className="md:hidden pt-4 pb-2.5 flex items-center justify-center bg-white border-b border-gray-50 shrink-0">
          <h1 className="text-sm font-bold text-gray-800 tracking-tight">
            간단하게 간단하자: EASY IF
          </h1>
        </header>

        <div key={location.pathname} className="flex-1 animate-fade-in flex flex-col md:p-2">
          <Outlet />
        </div>
        <div className="md:hidden mt-auto pt-10 pb-6 px-4">
          <FooterContent />
        </div>
      </main>
      
      {/* Mobile Bottom Navigation — 모바일 하단에 상시 노출 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-4 z-50">
        {showNav ? (
          <>
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
          </>
        ) : (
          <>
            <Link to="/onboarding" className={`flex flex-col items-center gap-1 ${location.pathname === '/onboarding' ? 'text-green-600' : 'text-gray-400'}`}>
              <Play size={24} />
              <span className="text-[10px] font-medium">시작하기</span>
            </Link>
            <Link to="/about" className={`flex flex-col items-center gap-1 ${location.pathname === '/about' ? 'text-green-600' : 'text-gray-400'}`}>
              <Info size={24} />
              <span className="text-[10px] font-medium">서비스 소개</span>
            </Link>
            <Link to="/guide" className={`flex flex-col items-center gap-1 ${location.pathname === '/guide' ? 'text-green-600' : 'text-gray-400'}`}>
              <BookOpen size={24} />
              <span className="text-[10px] font-medium">가이드</span>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
}
