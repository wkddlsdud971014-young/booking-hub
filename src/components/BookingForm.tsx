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
    <form onSubmit={handleSubmit} className="mb-8 p-10 bg-gray-50 rounded-3xl">
      <h2 className="text-3xl font-bold mb-8 text-black">새로운 예약을 추가하세요</h2>

      {error && (
        <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-2xl border border-red-200 font-medium text-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-sm font-semibold text-black mb-3">고객사</label>
          <input
            type="text"
            placeholder="예: ABC 회사"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full border border-gray-300 px-5 py-4 rounded-xl bg-white focus:border-black focus:outline-none transition-colors text-lg"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-3">서비스</label>
          <input
            type="text"
            placeholder="예: 컨설팅"
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full border border-gray-300 px-5 py-4 rounded-xl bg-white focus:border-black focus:outline-none transition-colors text-lg"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-3">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 px-5 py-4 rounded-xl bg-white focus:border-black focus:outline-none transition-colors text-lg"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-3">시간</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border border-gray-300 px-5 py-4 rounded-xl bg-white focus:border-black focus:outline-none transition-colors text-lg"
            disabled={loading}
          />
      </div>

        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-semibold text-black mb-3">주소</label>
        <input
          type="text"
          placeholder="예: 서울시 강남구 테헤란로 123"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          className="w-full border border-gray-300 px-5 py-4 rounded-xl bg-white focus:border-black focus:outline-none transition-colors text-lg"
          disabled={loading}
        />
      </div>

      {geocodingStatus && (
        <div className={`mb-8 p-5 rounded-2xl font-medium text-lg border-l-4 ${
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
        className="w-full bg-black text-white py-5 rounded-2xl font-bold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-lg"
      >
        {loading ? '추가 중...' : latitude && longitude ? '예약하기' : '주소를 먼저 확인해주세요'}
      </button>
    </form>
  );
}
