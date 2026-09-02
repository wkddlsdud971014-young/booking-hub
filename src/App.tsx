import { useRef, useState, useEffect } from 'react';
import { BookingTable, type BookingTableRef } from './components/BookingTable';
import { BookingForm } from './components/BookingForm';
import { StatCards, type StatCardsRef } from './components/StatCards';
import { Login } from './components/Login';
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
    <div className="pb-24 bg-gray-50 min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">📅 예약 관리</h1>
            <p className="text-gray-500 text-sm">모든 예약 정보를 한 곳에서 관리하세요</p>
          </div>
          {user && (
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-gray-200">
              <div className="text-right">
                {user.name && (
                  <div className="font-semibold text-gray-800 text-sm">{user.name}</div>
                )}
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              {user.picture && (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-9 h-9 rounded-full border-2 border-blue-500"
                />
              )}
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full text-xs font-medium transition"
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

        {/* 상태관리 탭 */}
        {activeTab === 'status' && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">✅ 상태 관리</h2>
            <p className="text-gray-500 text-sm mb-8">예약 상태를 관리하고 확정 현황을 파악하세요</p>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <p className="text-gray-700">
                💡 표의 <span className="font-semibold text-blue-600">상태</span> 열에서 배지를 클릭하면 <span className="font-semibold">대기(⏳)</span>와 <span className="font-semibold">확정(✅)</span>을 전환할 수 있습니다.
              </p>
            </div>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}

        {/* 위치확인 탭 */}
        {activeTab === 'location' && (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">📍 위치 확인</h2>
            <p className="text-gray-500 text-sm mb-8">예약 위치를 지도에서 확인하고 좌표 정보를 조회하세요</p>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <p className="text-gray-700">
                💡 표의 <span className="font-semibold text-blue-600">위치</span> 열에서 주소를 클릭하면 <span className="font-semibold">OpenStreetMap</span>에서 위치를 확인할 수 있고, <span className="font-semibold">좌표</span> 열에서 정확한 위도/경도를 볼 수 있습니다.
              </p>
            </div>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}
      </div>

      {/* 하단 탭 바 - 토스 스타일 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto flex justify-between px-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 대시보드
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 목록
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'add'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ 추가
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'status'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ✅ 상태
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-5 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'location'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📍 위치
          </button>
        </div>
      </div>
    </div>
  )
}
