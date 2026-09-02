import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (userEmail: string) => void;
}

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

export function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 이미 로그인된 상태 확인
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email) {
        checkAdminAccess(data.session.user.email);
      }
    };
    checkSession();
  }, []);

  const checkAdminAccess = (email: string) => {
    if (email === ADMIN_EMAIL) {
      onLoginSuccess(email);
    } else {
      setError(`접근 불가: ${email}는 등록되지 않은 이메일입니다.`);
      signOut();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패');
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">예약 관리 허브</h1>
          <p className="text-gray-500 text-lg">Google 계정으로 로그인하세요</p>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-medium">
            ❌ {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 py-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-3 mb-6"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? '로그인 중...' : 'Google로 로그인'}
        </button>

        <p className="text-center text-gray-500 text-sm">
          <span className="inline-block bg-gray-200 rounded-full px-4 py-2">
            🔒 관리자만 접근 가능
          </span>
        </p>
      </div>
    </div>
  );
}
