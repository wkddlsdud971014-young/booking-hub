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
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">예약 관리 허브</h1>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                {user.name && (
                  <div className="font-semibold text-gray-800">{user.name}</div>
                )}
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              {user.picture && (
                <img
                  src={user.picture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm ml-2"
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
            <h2 className="text-2xl font-bold mb-4">상태 관리</h2>
            <p className="text-gray-600 mb-6 p-4 bg-yellow-50 rounded">
              💡 팁: 표의 "상태" 열에서 배지를 클릭하면 대기(pending) ↔ 확정(confirmed)으로 전환됩니다.
            </p>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}

        {/* 위치확인 탭 */}
        {activeTab === 'location' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">위치 확인</h2>
            <p className="text-gray-600 mb-6 p-4 bg-blue-50 rounded">
              💡 팁: 표의 "위치" 열에서 주소를 클릭하면 Google Maps에서 위치를 확인할 수 있습니다.
            </p>
            <BookingTable ref={tableRef} onStatusChange={() => statsRef.current?.refresh()} />
          </div>
        )}
      </div>

      {/* 하단 탭 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📊 대시보드
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 목록
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              activeTab === 'add'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ 추가
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              activeTab === 'status'
                ? 'text-blue-600 border-b-4 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ✅ 상태
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-4 text-sm font-semibold transition ${
              activeTab === 'location'
                ? 'text-blue-600 border-b-4 border-blue-600'
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
