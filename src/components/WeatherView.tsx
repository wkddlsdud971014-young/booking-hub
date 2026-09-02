import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer: string;
  date: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface WeatherInfo {
  bookingId: number;
  temp: number;
  description: string;
  icon: string;
}

export interface WeatherViewRef {
  refresh: () => void;
}

const WeatherViewComponent = forwardRef<WeatherViewRef>((_, ref) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weather, setWeather] = useState<Map<number, WeatherInfo>>(new Map());
  const [loading, setLoading] = useState(true);
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
        .select('id, customer, date, latitude, longitude')
        .order('date', { ascending: true });

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

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-lg">🌤️ 날씨 로딩 중...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-12 text-gray-500 text-lg">📭 예약이 없습니다</div>;
  }

  const getWeatherEmoji = (icon: string) => {
    if (icon === '01d') return '☀️';
    if (icon === '02d') return '⛅';
    if (icon === '03d') return '☁️';
    if (icon === '04d') return '☁️';
    if (icon === '09d') return '🌧️';
    if (icon === '10d') return '🌧️';
    if (icon === '11d') return '⛈️';
    if (icon === '13d') return '❄️';
    return '🌤️';
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-black mb-8">예약별 날씨</h3>
      <div className="grid grid-cols-3 gap-5">
        {bookings.map((booking) => {
          const w = weather.get(booking.id);
          return (
            <div key={booking.id} className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
              <div className="mb-4">
                <div className="font-semibold text-black text-lg mb-1">{booking.customer}</div>
                <div className="text-gray-600 text-sm">{booking.date}</div>
              </div>

              {w ? (
                <div className="text-center">
                  <div className="text-6xl mb-4">{getWeatherEmoji(w.icon)}</div>
                  <div className="text-5xl font-bold text-black mb-2">{w.temp}°</div>
                  <div className="text-gray-600 text-sm">{w.description}</div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">날씨 정보 없음</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

WeatherViewComponent.displayName = 'WeatherView';

export const WeatherView = WeatherViewComponent;
