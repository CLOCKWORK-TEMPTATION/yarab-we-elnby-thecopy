'use client';

/**
 * لوحة تحكم المخرج - Director Dashboard
 * 
 * @description
 * تتيح للمخرج تحديد موقع التصوير اليومي
 * وعرض الموردين القريبين وإنشاء جلسات الطلب
 * 
 * السبب: المخرج يحتاج لإدارة مركزية لموقع التصوير
 * والموردين المتاحين لتسهيل عملية التموين للفريق
 */

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import axios, { AxiosError } from 'axios';
import type { Vendor, VendorMapData } from '../../../lib/types';

// تحميل ديناميكي لمكون الخريطة لتجنب مشاكل SSR
const MapComponent = dynamic(() => import('../../../components/maps/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      جارٍ تحميل الخريطة...
    </div>
  ),
});

/**
 * استجابة إنشاء الجلسة
 * 
 * @description
 * يمثل الاستجابة من نقطة النهاية /geo/session
 * عند إنشاء جلسة تصوير يومية جديدة تحتوي على معرّف الجلسة
 */
interface SessionResponse {
  id: string;
}

/**
 * لوحة تحكم المخرج
 * 
 * @description
 * تعرض خريطة لتحديد موقع التصوير
 * وقائمة الموردين القريبين مع إمكانية إنشاء جلسة طلب
 */
export default function DirectorDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');

  const apiUrl = useMemo(() => 
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    []
  );

  /**
   * معالج اختيار الموقع على الخريطة
   */
  const handleLocationSelect = useCallback(async (lat: number, lng: number): Promise<void> => {
    setSelectedLocation({ lat, lng });
    setLoading(true);

    try {
      const response = await axios.get<Vendor[]>(`${apiUrl}/geo/vendors/nearby`, {
        params: { lat, lng, radius: 3000 },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setVendors(response.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في جلب الموردين:', axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  /**
   * إنشاء جلسة يومية
   */
  const handleCreateSession = useCallback(async (): Promise<void> => {
    if (!selectedLocation || !projectId) {
      alert('يرجى اختيار موقع وإدخال معرّف المشروع');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<SessionResponse>(
        `${apiUrl}/geo/session`,
        {
          projectId,
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setSessionId(response.data.id);
      alert('تم إنشاء الجلسة اليومية بنجاح!');
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في إنشاء الجلسة:', axiosError.message);
      alert('فشل في إنشاء الجلسة');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, projectId, apiUrl]);

  /**
   * تحويل بيانات الموردين لصيغة الخريطة
   */
  const vendorsForMap: VendorMapData[] = useMemo(() => 
    vendors.map((v) => ({
      id: v.id,
      name: v.name,
      lat: v.fixed_location.lat,
      lng: v.fixed_location.lng,
      distance: v.distance,
    })),
    [vendors]
  );

  /**
   * معالج تغيير معرّف المشروع
   */
  const handleProjectIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setProjectId(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة تحكم المخرج</h1>
          <p className="text-gray-600">حدد موقع التصوير اليوم واعرض الموردين القريبين</p>
        </div>

        {/* إدخال معرّف المشروع */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            معرّف المشروع
          </label>
          <input
            type="text"
            value={projectId}
            onChange={handleProjectIdChange}
            placeholder="أدخل معرّف المشروع"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* قسم الخريطة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">اختر موقع التصوير</h2>
          <MapComponent
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
            onLocationSelect={handleLocationSelect}
            vendors={vendorsForMap}
            className="mb-4"
          />
          
          {selectedLocation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>الموقع المحدد:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
              <button
                onClick={handleCreateSession}
                disabled={loading || !projectId}
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'جارٍ الإنشاء...' : 'إنشاء جلسة يومية'}
              </button>
            </div>
          )}

          {sessionId && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">
                <strong>تم إنشاء الجلسة!</strong> معرّف الجلسة: {sessionId}
              </p>
            </div>
          )}
        </div>

        {/* قائمة الموردين */}
        {vendors.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              الموردون القريبون ({vendors.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                  {vendor.distance && (
                    <p className="text-sm text-gray-600 mt-1">
                      المسافة: {Math.round(vendor.distance)} متر
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {vendor.fixed_location.lat.toFixed(4)}, {vendor.fixed_location.lng.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
