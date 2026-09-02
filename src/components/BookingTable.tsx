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
    return <div className="text-center py-8 text-gray-600">로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-600">예약이 없습니다</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">고객사</th>
            <th className="border border-gray-300 px-4 py-2 text-left">서비스</th>
            <th className="border border-gray-300 px-4 py-2 text-left">날짜</th>
            <th className="border border-gray-300 px-4 py-2 text-left">시간</th>
            <th className="border border-gray-300 px-4 py-2 text-left">위치</th>
            <th className="border border-gray-300 px-4 py-2 text-left">날씨</th>
            <th className="border border-gray-300 px-4 py-2 text-left">좌표</th>
            <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{booking.customer}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.service}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.date}</td>
              <td className="border border-gray-300 px-4 py-2">{booking.time}</td>
              <td className="border border-gray-300 px-4 py-2">
                {booking.address ? (
                  <a
                    href={getMapLink(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {booking.address}
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                {weather.get(booking.id) ? (
                  <div className="text-center">
                    <div className="text-2xl mb-1">
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
                    <div className="font-semibold">{weather.get(booking.id)!.temp}°C</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-sm">
                {booking.latitude && booking.longitude ? (
                  <div className="space-y-1">
                    <div>📍 {booking.latitude.toFixed(6)}</div>
                    <div>📍 {booking.longitude.toFixed(6)}</div>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                <button
                  onClick={() => toggleStatus(booking.id, booking.status)}
                  className={`px-3 py-1 rounded text-sm font-semibold cursor-pointer ${
                    booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {booking.status === 'pending' ? '대기' : '확정'}
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
