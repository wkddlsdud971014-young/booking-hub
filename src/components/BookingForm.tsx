import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface BookingFormProps {
  onSuccess?: () => void;
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const [customer, setCustomer] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geocodingStatus, setGeocodingStatus] = useState<string>('');

  const geocodeAddress = async (addr: string): Promise<boolean> => {
    try {
      setGeocodingStatus('위치 검색 중...');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'booking-hub' } }
      );
      const data = await response.json();

      if (data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        setGeocodingStatus(`✅ 위치 검색 완료: ${data[0].display_name}`);
        return true;
      } else {
        setGeocodingStatus('❌ 주소를 찾을 수 없습니다');
        setLatitude(null);
        setLongitude(null);
        return false;
      }
    } catch (err) {
      setGeocodingStatus('❌ 위치 검색 실패');
      setLatitude(null);
      setLongitude(null);
      return false;
    }
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (value.length > 5) {
      geocodeAddress(value);
    } else {
      setGeocodingStatus('');
      setLatitude(null);
      setLongitude(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer || !service || !date || !time || !address) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    if (!latitude || !longitude) {
      setError('유효한 주소를 선택해주세요. 주소 검색이 완료될 때까지 기다려주세요.');
      return;
    }

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert({
          customer,
          service,
          date,
          time,
          address,
          latitude,
          longitude,
          via: 'form',
        });

      if (insertError) throw insertError;

      setCustomer('');
      setService('');
      setDate('');
      setTime('');
      setAddress('');
      setLatitude(null);
      setLongitude(null);
      setGeocodingStatus('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약 추가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-8 bg-white rounded-xl border border-blue-200 shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">✏️ 새 예약 추가</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
          ❌ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-6">
        <input
          type="text"
          placeholder="고객사"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="border-2 border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          disabled={loading}
        />
        <input
          type="text"
          placeholder="서비스"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="border-2 border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          disabled={loading}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border-2 border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          disabled={loading}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border-2 border-gray-200 px-4 py-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          disabled={loading}
        />
      </div>

      <input
        type="text"
        placeholder="주소 (예: 서울시 강남구 테헤란로)"
        value={address}
        onChange={(e) => handleAddressChange(e.target.value)}
        className="w-full border-2 border-gray-200 px-4 py-3 rounded-lg mb-3 focus:border-blue-500 focus:outline-none transition-colors"
        disabled={loading}
      />
      {geocodingStatus && (
        <div className={`mb-6 text-sm p-3 rounded-lg border-l-4 font-medium ${
          geocodingStatus.includes('✅')
            ? 'bg-green-50 text-green-800 border-green-500'
            : 'bg-red-50 text-red-800 border-red-500'
        }`}>
          {geocodingStatus}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !latitude || !longitude}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 transition-all text-lg"
      >
        {loading ? '⏳ 추가 중...' : latitude && longitude ? '✅ 예약하기' : '📍 주소 검색 완료 후 진행'}
      </button>
    </form>
  );
}
