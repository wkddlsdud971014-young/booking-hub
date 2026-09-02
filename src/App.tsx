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
    <div className="pb-24 bg-white min-h-screen">
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-5xl font-bold text-black mb-2">예약 관리</h1>
            <p className="text-gray-600 text-lg">간편하게 모든 예약을 관리하세요</p>
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

        {/* 상태관리 탭 */}
        {activeTab === 'status' && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">상태 관리</h2>
            <p className="text-gray-600 text-lg mb-10">예약 상태를 한눈에 파악하세요</p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-black mb-3">⏳</div>
                <div className="text-4xl font-bold text-black mb-1">대기 중</div>
                <div className="text-gray-600">확정 대기 예약</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-black mb-3">✅</div>
                <div className="text-4xl font-bold text-black mb-1">확정됨</div>
                <div className="text-gray-600">확정된 예약</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 mb-8">
              <p className="text-gray-700 text-lg">
                아래 예약 목록에서 상태를 클릭하면 <span className="font-semibold">대기</span>와 <span className="font-semibold">확정</span>을 전환할 수 있습니다.
              </p>
            </div>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}

        {/* 위치확인 탭 */}
        {activeTab === 'location' && (
          <div>
            <h2 className="text-3xl font-bold text-black mb-4">위치 확인</h2>
            <p className="text-gray-600 text-lg mb-10">모든 예약의 위치를 확인하세요</p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-black mb-3">🗺️</div>
                <div className="text-2xl font-bold text-black mb-1">지도 보기</div>
                <div className="text-gray-600">주소 클릭 시</div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 text-center">
                <div className="text-5xl font-bold text-black mb-3">📍</div>
                <div className="text-2xl font-bold text-black mb-1">좌표 확인</div>
                <div className="text-gray-600">위도/경도 표시</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 mb-8">
              <p className="text-gray-700 text-lg">
                위치 열의 주소를 클릭하면 OpenStreetMap에서 위치를 확인할 수 있고, 좌표 열에서는 정확한 위도/경도를 볼 수 있습니다.
              </p>
            </div>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}
      </div>

      {/* 하단 탭 바 - Apple 스타일 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 z-50">
        <div className="max-w-5xl mx-auto flex justify-between px-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            대시보드
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'list'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'add'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            추가
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'status'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            상태
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-6 text-sm font-medium transition-all duration-200 ${
              activeTab === 'location'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            위치
          </button>
        </div>
      </div>
    </div>
  )
}
