import { useRef, useState, useEffect } from 'react';
import { BookingTable, type BookingTableRef } from './components/BookingTable';
import { BookingForm } from './components/BookingForm';
import { StatCards, type StatCardsRef } from './components/StatCards';
import { Login } from './components/Login';
import { LocationMap, type LocationMapRef } from './components/LocationMap';
import { WeatherView, type WeatherViewRef } from './components/WeatherView';
import { supabase } from './lib/supabase';

type Tab = 'dashboard' | 'list' | 'add' | 'status' | 'location';

interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<BookingTableRef>(null);
  const statsRef = useRef<StatCardsRef>(null);
  const locationMapRef = useRef<LocationMapRef>(null);
  const weatherViewRef = useRef<WeatherViewRef>(null);

  useEffect(() => {
    checkAuth();
    setupAuthListener();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.email) {
      const metadata = data.session.user.user_metadata;
      setUser({
        email: data.session.user.email,
        name: metadata?.name || metadata?.full_name,
        picture: metadata?.picture,
      });
    }
    setLoading(false);
  };

  const setupAuthListener = () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user?.email) {
          const metadata = session.user.user_metadata;
          setUser({
            email: session.user.email,
            name: metadata?.name || metadata?.full_name,
            picture: metadata?.picture,
          });
        } else {
          setUser(null);
        }
      }
    );
    return () => subscription?.unsubscribe();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => checkAuth()} />;
  }

  return (
    <div className="pb-24 bg-white min-h-screen">
      <div className="px-8 py-12 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-semibold text-black mb-3">예약 관리</h1>
            <p className="text-gray-600 text-lg">간편하게 모든 예약을 한 곳에서 관리하세요</p>
          </div>
          {user && (
            <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-2xl">
              <div className="text-right">
                {user.name && (
                  <div className="font-semibold text-black text-sm">{user.name}</div>
                )}
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              {user.picture && (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full"
                />
              )}
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-gray-900 text-white hover:bg-black rounded-xl text-sm font-medium transition"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && (
          <div>
            <StatCards ref={statsRef} />
          </div>
        )}

        {/* 예약목록 탭 */}
        {activeTab === 'list' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">예약 목록</h2>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}

        {/* 예약추가 탭 */}
        {activeTab === 'add' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">새 예약 추가</h2>
            <BookingForm
              onSuccess={() => {
                tableRef.current?.refresh();
                statsRef.current?.refresh();
                setActiveTab('list');
              }}
            />
          </div>
        )}

        {/* 상태관리 탭 - 날씨 */}
        {activeTab === 'status' && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">예약 날씨</h2>
            <p className="text-gray-600 text-lg mb-10">각 예약 날짜의 날씨를 미리 확인하세요</p>
            <WeatherView ref={weatherViewRef} />
          </div>
        )}

        {/* 위치확인 탭 - 지도 */}
        {activeTab === 'location' && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">예약 위치</h2>
            <p className="text-gray-600 text-lg mb-10">지도에서 모든 예약 위치를 확인하세요</p>
            <LocationMap ref={locationMapRef} />
          </div>
        )}
      </div>

      {/* 하단 탭 바 - Apple 스타일 (단일 파란색 액센트) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="max-w-6xl mx-auto flex justify-between px-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-5 text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-5 text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-5 text-sm font-medium transition-all ${
              activeTab === 'add'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            추가
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-5 text-sm font-medium transition-all ${
              activeTab === 'status'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            날씨
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-5 text-sm font-medium transition-all ${
              activeTab === 'location'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            위치
          </button>
        </div>
      </div>
    </div>
  )
}
