import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: string;
  via: string;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface WeatherInfo {
  bookingId: number;
  temp: number;
  description: string;
  icon: string;
}

export interface BookingTableRef {
  refresh: () => void;
  setOnStatusChange?: (callback: () => void) => void;
}

interface BookingTableProps {
  onStatusChange?: () => void;
}

const BookingTableComponent = forwardRef<BookingTableRef, BookingTableProps>(({ onStatusChange }, ref) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<Map<number, WeatherInfo>>(new Map());
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  const fetchWeather = async (booking: Booking) => {
    if (!booking.latitude || !booking.longitude || !apiKey) return;

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${booking.latitude}&lon=${booking.longitude}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();

      if (data.main) {
        setWeather((prev) =>
          new Map(prev).set(booking.id, {
            bookingId: booking.id,
            temp: Math.round(data.main.temp),
            description: data.weather[0].main,
            icon: data.weather[0].icon,
          })
        );
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      data?.forEach((booking) => fetchWeather(booking));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchBookings,
  }));

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBookings();
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getMapLink = (booking: Booking) => {
    if (booking.latitude && booking.longitude) {
      return `https://www.openstreetmap.org/?mlat=${booking.latitude}&mlon=${booking.longitude}&zoom=15`;
    }
    if (!booking.address) return '#';
    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(booking.address)}`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-lg">📊 로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-16 text-gray-500 text-lg">📭 예약이 없습니다</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full border-collapse table-auto">
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">고객사</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">서비스</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">날짜</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">시간</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">위치</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">날씨</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">좌표</th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm">상태</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-blue-50 border-b border-gray-200 transition-colors">
              <td className="px-6 py-4 text-gray-800 font-medium">{booking.customer}</td>
              <td className="px-6 py-4 text-gray-700">{booking.service}</td>
              <td className="px-6 py-4 text-gray-700">{booking.date}</td>
              <td className="px-6 py-4 text-gray-700">{booking.time}</td>
              <td className="px-6 py-4">
                {booking.address ? (
                  <a
                    href={getMapLink(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                  >
                    {booking.address}
                  </a>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {weather.get(booking.id) ? (
                  <div className="bg-blue-50 rounded-lg p-3 inline-block">
                    <div className="text-3xl mb-2">
                      {weather.get(booking.id)!.icon === '01d' && '☀️'}
                      {weather.get(booking.id)!.icon === '02d' && '⛅'}
                      {weather.get(booking.id)!.icon === '03d' && '☁️'}
                      {weather.get(booking.id)!.icon === '04d' && '☁️'}
                      {weather.get(booking.id)!.icon === '09d' && '🌧️'}
                      {weather.get(booking.id)!.icon === '10d' && '🌧️'}
                      {weather.get(booking.id)!.icon === '11d' && '⛈️'}
                      {weather.get(booking.id)!.icon === '13d' && '❄️'}
                      {!['01d', '02d', '03d', '04d', '09d', '10d', '11d', '13d'].includes(weather.get(booking.id)!.icon) && '🌤️'}
                    </div>
                    <div className="font-bold text-lg text-gray-800">{weather.get(booking.id)!.temp}°C</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                {booking.latitude && booking.longitude ? (
                  <div className="bg-gray-50 rounded p-2 text-xs space-y-1 font-mono">
                    <div className="text-gray-600">📍 <span className="text-gray-800 font-semibold">{booking.latitude.toFixed(4)}</span></div>
                    <div className="text-gray-600">📍 <span className="text-gray-800 font-semibold">{booking.longitude.toFixed(4)}</span></div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => toggleStatus(booking.id, booking.status)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
                    booking.status === 'pending'
                      ? 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                      : 'bg-green-200 text-green-900 hover:bg-green-300'
                  }`}
                >
                  {booking.status === 'pending' ? '⏳ 대기' : '✅ 확정'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

BookingTableComponent.displayName = 'BookingTable';

export const BookingTable = BookingTableComponent;
