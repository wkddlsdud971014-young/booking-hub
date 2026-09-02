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

  const geocodeAddress = async (addr: string) => {
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
      } else {
        setGeocodingStatus('❌ 주소를 찾을 수 없습니다');
        setLatitude(null);
        setLongitude(null);
      }
    } catch (err) {
      setGeocodingStatus('❌ 위치 검색 실패');
      setLatitude(null);
      setLongitude(null);
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
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4">새 예약 추가</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="고객사"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded"
          disabled={loading}
        />
        <input
          type="text"
          placeholder="서비스"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded"
          disabled={loading}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded"
          disabled={loading}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border border-gray-300 px-3 py-2 rounded"
          disabled={loading}
        />
      </div>

      <input
        type="text"
        placeholder="주소"
        value={address}
        onChange={(e) => handleAddressChange(e.target.value)}
        className="w-full border border-gray-300 px-3 py-2 rounded mb-2"
        disabled={loading}
      />
      {geocodingStatus && (
        <div className="mb-4 text-sm text-gray-600">
          {geocodingStatus}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? '추가 중...' : '예약하기'}
      </button>
    </form>
  );
}
