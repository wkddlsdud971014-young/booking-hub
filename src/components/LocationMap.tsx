import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer, address, latitude, longitude')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
      if (mapRef.current) {
        updateMapMarkers(data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (bookingsList: Booking[]) => {
    if (!mapRef.current) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bookingsWithCoords = bookingsList.filter(b => b.latitude && b.longitude);

    if (bookingsWithCoords.length === 0) return;

    // 새 마커 추가
    bookingsWithCoords.forEach((booking) => {
      if (booking.latitude && booking.longitude) {
        const marker = L.marker([booking.latitude, booking.longitude])
          .bindPopup(`
            <div class="p-3">
              <div class="font-semibold text-black mb-2">${booking.customer}</div>
              <div class="text-sm text-gray-600">${booking.address}</div>
              <div class="text-xs text-gray-500 mt-2">
                📍 ${booking.latitude.toFixed(4)}, ${booking.longitude.toFixed(4)}
              </div>
            </div>
          `)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      }
    });

    // 모든 마커가 보이도록 지도 조정
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      mapRef.current = L.map(mapContainerRef.current).setView([37.5665, 126.9780], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      const defaultIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = defaultIcon;

      fetchBookings();
    } catch (error) {
      console.error('Map error:', error);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchBookings,
  }));

  if (loading) {
    return <div className="text-center py-12 text-gray-500 text-lg">📍 지도 로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 지도 */}
      <div
        ref={mapContainerRef}
        className="rounded-3xl overflow-hidden shadow-sm border border-gray-200"
        style={{ height: '600px' }}
      />

      {/* 예약 위치 목록 */}
      <div>
        <h3 className="text-2xl font-bold text-black mb-6">예약 위치 목록</h3>
        <div className="grid grid-cols-2 gap-4">
          {bookings
            .filter(b => b.latitude && b.longitude)
            .map((booking) => (
              <div
                key={booking.id}
                className="bg-gray-50 p-6 rounded-2xl border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
                onClick={() => {
                  if (mapRef.current && booking.latitude && booking.longitude) {
                    mapRef.current.setView([booking.latitude, booking.longitude], 16);
                  }
                }}
              >
                <div className="font-semibold text-black mb-2">{booking.customer}</div>
                <div className="text-gray-600 text-sm mb-3">{booking.address}</div>
                <div className="text-xs text-gray-500">
                  📍 {booking.latitude?.toFixed(4)}, {booking.longitude?.toFixed(4)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
});

LocationMapComponent.displayName = 'LocationMap';

export const LocationMap = LocationMapComponent;
