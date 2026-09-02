import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  date: string;
  status: string;
  created_at: string;
}

export interface StatCardsRef {
  refresh: () => void;
}

const StatCardsComponent = forwardRef<StatCardsRef>((_, ref) => {
  const [todayCount, setTodayCount] = useState(0);
  const [confirmRate, setConfirmRate] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) throw error;

      const bookings = data as Booking[];

      // 오늘 날짜
      const today = new Date().toISOString().split('T')[0];

      // 이번 주 월-금 범위 (월요일-금요일)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const friday = new Date(monday);
      friday.setDate(friday.getDate() + 4);

      const mondayStr = monday.toISOString().split('T')[0];
      const fridayStr = friday.toISOString().split('T')[0];

      // 계산
      const today_bookings = bookings.filter(b => b.date === today).length;
      const confirmed = bookings.filter(b => b.status === 'confirmed').length;
      const total = bookings.length;
      const rate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0.0';
      const week_bookings = bookings.filter(b => b.date >= mondayStr && b.date <= fridayStr).length;

      setTodayCount(today_bookings);
      setConfirmRate(parseFloat(rate));
      setWeekCount(week_bookings);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchStats,
  }));

  return (
    <div className="grid grid-cols-3 gap-6 mb-10">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold text-blue-600 mb-2">{todayCount}</div>
            <div className="text-gray-700 font-semibold text-lg">오늘 예약</div>
          </div>
          <div className="text-5xl">📅</div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold text-green-600 mb-2">{confirmRate}%</div>
            <div className="text-gray-700 font-semibold text-lg">확정률</div>
          </div>
          <div className="text-5xl">✅</div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold text-purple-600 mb-2">{weekCount}</div>
            <div className="text-gray-700 font-semibold text-lg">이번 주 예약</div>
          </div>
          <div className="text-5xl">📊</div>
        </div>
      </div>
    </div>
  );
});

StatCardsComponent.displayName = 'StatCards';

export const StatCards = StatCardsComponent;
