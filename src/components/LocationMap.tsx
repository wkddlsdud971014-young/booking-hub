import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../lib/supabase';

interface Booking {
  id: number;
  customer: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationMapRef {
  refresh: () => void;
}

const LocationMapComponent = forwardRef<LocationMapRef>((_, ref) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer, address, latitude, longitude')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
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
    return <div className="text-center py-12 text-gray-500 text-lg">📍 위치 로딩 중...</div>;
  }

  const bookingsWithCoords = bookings.filter(b => b.latitude && b.longitude);

  if (bookingsWithCoords.length === 0) {
    return <div className="text-center py-12 text-gray-500 text-lg">📍 위치 정보가 없습니다</div>;
  }

  // 모든 좌표의 중심점 계산
  const avgLat = bookingsWithCoords.reduce((sum, b) => sum + (b.latitude || 0), 0) / bookingsWithCoords.length;
  const avgLon = bookingsWithCoords.reduce((sum, b) => sum + (b.longitude || 0), 0) / bookingsWithCoords.length;

  return (
    <div className="space-y-6">
      {/* 지도 */}
      <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-200" style={{ height: '500px' }}>
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${avgLon - 0.05},${avgLat - 0.05},${avgLon + 0.05},${avgLat + 0.05}&layer=mapnik&marker=${avgLat},${avgLon}`}
        />
      </div>

      {/* 예약 위치 목록 */}
      <div>
        <h3 className="text-2xl font-bold text-black mb-6">예약 위치 목록</h3>
        <div className="grid grid-cols-2 gap-4">
          {bookingsWithCoords.map((booking) => (
            <a
              key={booking.id}
              href={`https://www.openstreetmap.org/?mlat=${booking.latitude}&mlon=${booking.longitude}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:bg-gray-100 transition"
            >
              <div className="font-semibold text-black mb-2">{booking.customer}</div>
              <div className="text-gray-600 text-sm mb-3">{booking.address}</div>
              <div className="text-xs text-gray-500">
                📍 {booking.latitude?.toFixed(4)}, {booking.longitude?.toFixed(4)}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
});

LocationMapComponent.displayName = 'LocationMap';

export const LocationMap = LocationMapComponent;
