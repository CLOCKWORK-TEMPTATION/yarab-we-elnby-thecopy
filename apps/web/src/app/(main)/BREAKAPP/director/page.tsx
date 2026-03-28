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
import { AxiosError } from 'axios';
import type { Vendor, VendorMapData } from '@the-copy/breakapp';
import { getToken } from '../lib/auth';
import { api } from '../lib/auth';
import { toast } from '@/hooks/use-toast';

// تحميل ديناميكي لمكون الخريطة لتجنب مشاكل SSR
const MapComponent = dynamic(
  () => import('@the-copy/breakapp').then((mod) => ({ default: mod.MapComponent })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 font-cairo">جارٍ تحميل الخريطة...</p>
      </div>
    ),
  }
);

/**
 * استجابة إنشاء الجلسة
 */
interface SessionResponse {
  id: string;
}

export default function DirectorDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string>('');

  /**
   * معالج اختيار الموقع على الخريطة
   */
  const handleLocationSelect = useCallback(async (lat: number, lng: number): Promise<void> => {
    setSelectedLocation({ lat, lng });
    setLoading(true);

    try {
      const response = await api.get<Vendor[]>('/geo/vendors/nearby', {
        params: { lat, lng, radius: 3000 },
      });

      setVendors(response.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      toast({
        title: 'خطأ في جلب الموردين',
        description: axiosError.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * إنشاء جلسة يومية
   */
  const handleCreateSession = useCallback(async (): Promise<void> => {
    if (!selectedLocation || !projectId) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى اختيار موقع وإدخال معرّف المشروع',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<SessionResponse>('/geo/session', {
        projectId,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });

      setSessionId(response.data.id);
      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الجلسة اليومية بنجاح!',
      });
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      toast({
        title: 'فشل إنشاء الجلسة',
        description: axiosError.message || 'حدث خطأ أثناء إنشاء الجلسة',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, projectId]);

  /**
   * تحويل بيانات الموردين لصيغة الخريطة
   */
  const vendorsForMap: VendorMapData[] = useMemo(
    () =>
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
    <div dir="rtl" className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* العنوان مع زر العودة */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-cairo">لوحة تحكم المخرج</h1>
            <p className="text-gray-600 font-cairo">حدد موقع التصوير اليوم واعرض الموردين القريبين</p>
          </div>
          <a
            href="/BREAKAPP/dashboard"
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-cairo"
          >
            العودة للوحة التحكم
          </a>
        </div>

        {/* إدخال معرّف المشروع */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-cairo">
            معرّف المشروع
          </label>
          <input
            type="text"
            value={projectId}
            onChange={handleProjectIdChange}
            placeholder="أدخل معرّف المشروع"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-cairo"
          />
        </div>

        {/* قسم الخريطة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 font-cairo">اختر موقع التصوير</h2>
          <MapComponent
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : undefined}
            onLocationSelect={handleLocationSelect}
            vendors={vendorsForMap}
            className="mb-4"
          />

          {selectedLocation && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-gray-700 font-cairo">
                <strong>الموقع المحدد:</strong> {selectedLocation.lat.toFixed(6)},{' '}
                {selectedLocation.lng.toFixed(6)}
              </p>
              <button
                onClick={handleCreateSession}
                disabled={loading || !projectId}
                className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-cairo"
              >
                {loading ? 'جارٍ الإنشاء...' : 'إنشاء جلسة يومية'}
              </button>
            </div>
          )}

          {sessionId && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-800 font-cairo">
                <strong>تم إنشاء الجلسة!</strong> معرّف الجلسة: {sessionId}
              </p>
            </div>
          )}
        </div>

        {/* قائمة الموردين */}
        {vendors.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 font-cairo">
              الموردون القريبون ({vendors.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 font-cairo">{vendor.name}</h3>
                  {vendor.distance && (
                    <p className="text-sm text-gray-600 mt-1 font-cairo">
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
