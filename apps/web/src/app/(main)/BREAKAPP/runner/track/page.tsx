'use client';

/**
 * صفحة تتبع Runner - Runner Track Page
 *
 * @description
 * تتيح لعامل التوصيل (Runner) تتبع موقعه
 * وإدارة مهام التوصيل المُسندة إليه
 *
 * السبب: تتبع موقع Runner ضروري لتوفير معلومات
 * دقيقة للمخرج عن توقيت وصول الطلبات
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGeolocation } from '@the-copy/breakapp';
import { useSocket } from '@the-copy/breakapp';
import { AxiosError } from 'axios';
import type { DeliveryTask } from '@the-copy/breakapp';
import { api } from '../../lib/auth';
import { toast } from '@/hooks/use-toast';

/**
 * استجابة API للمهام المجمّعة
 */
interface BatchTaskResponse {
  vendorId: string;
  vendorName: string;
  totalItems: number;
}

export default function RunnerTrackPage() {
  const [runnerId, setRunnerId] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [loadingTasks, setLoadingTasks] = useState(false);

  const { position, error: geoError } = useGeolocation();
  const { connected, emit, on, off } = useSocket();

  // الحصول على أو إنشاء معرّف Runner
  useEffect(() => {
    let id = localStorage.getItem('runnerId');
    if (!id) {
      id = `runner-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('runnerId', id);
    }
    setRunnerId(id);
  }, []);

  // تسجيل Runner والاستماع للمهام
  useEffect(() => {
    if (!connected || !runnerId) return;

    emit('runner:register', { runnerId });

    const taskHandler = (task: DeliveryTask): void => {
      setTasks((prev) => [...prev, task]);
      toast({
        title: 'مهمة جديدة',
        description: `تم إسناد مهمة توصيل جديدة من ${task.vendorName}`,
      });
    };

    on('task:new', taskHandler);

    return () => {
      off('task:new', taskHandler);
    };
  }, [connected, runnerId, emit, on, off]);

  // بث الموقع عند تتبعه
  useEffect(() => {
    if (!isTracking || !position || !connected) return;

    emit('runner:location', {
      runnerId,
      lat: position.latitude,
      lng: position.longitude,
      timestamp: position.timestamp,
    });
  }, [position, isTracking, connected, runnerId, emit]);

  /**
   * بدء تتبع الموقع
   */
  const startTracking = useCallback((): void => {
    setIsTracking(true);
    toast({
      title: 'تتبع الموقع',
      description: 'تم تفعيل بث الموقع',
    });
  }, []);

  /**
   * إيقاف تتبع الموقع
   */
  const stopTracking = useCallback((): void => {
    setIsTracking(false);
    toast({
      title: 'تتبع الموقع',
      description: 'تم إيقاف بث الموقع',
    });
  }, []);

  /**
   * جلب المهام من الخادم
   */
  const fetchTasks = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      toast({
        title: 'بيانات ناقصة',
        description: 'يرجى إدخال معرّف الجلسة',
        variant: 'destructive',
      });
      return;
    }

    setLoadingTasks(true);
    try {
      const response = await api.post<BatchTaskResponse[]>(
        `/orders/session/${sessionId}/batch`,
        {}
      );

      const batchedTasks: DeliveryTask[] = response.data.map((batch) => ({
        id: batch.vendorId,
        vendorName: batch.vendorName,
        items: batch.totalItems,
        status: 'pending' as const,
      }));

      setTasks(batchedTasks);
      toast({
        title: 'تم التحميل',
        description: `تم تحميل ${batchedTasks.length} مهمة`,
      });
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      toast({
        title: 'خطأ في جلب المهام',
        description: axiosError.message || 'تعذّر تحميل المهام',
        variant: 'destructive',
      });
    } finally {
      setLoadingTasks(false);
    }
  }, [sessionId]);

  /**
   * تحديث حالة المهمة
   */
  const updateTaskStatus = useCallback(
    (taskId: string, status: 'pending' | 'in-progress' | 'completed'): void => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? { ...task, status } : task))
      );

      if (connected) {
        emit('order:status', { orderId: taskId, status });
      }

      const statusLabels = {
        pending: 'معلق',
        'in-progress': 'قيد التنفيذ',
        completed: 'مكتمل',
      };
      toast({
        title: 'تحديث الحالة',
        description: `تم تغيير حالة المهمة إلى: ${statusLabels[status]}`,
      });
    },
    [connected, emit]
  );

  /**
   * معالج تغيير معرّف الجلسة
   */
  const handleSessionIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSessionId(e.target.value);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* العنوان مع زر العودة */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-cairo">لوحة تحكم Runner</h1>
            <p className="text-gray-600 font-cairo">تتبع موقعك وإدارة مهام التوصيل</p>
          </div>
          <a
            href="/BREAKAPP/dashboard"
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition font-cairo"
          >
            العودة للوحة التحكم
          </a>
        </div>

        {/* معلومات Runner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 font-cairo">معلومات Runner</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600 font-cairo">معرّف Runner:</span>
              <p className="font-mono text-sm">{runnerId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600 font-cairo">حالة الاتصال:</span>
              <span
                className={`mr-2 px-2 py-1 text-xs rounded-full ${
                  connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {connected ? 'متصل' : 'غير متصل'}
              </span>
            </div>
          </div>
        </div>

        {/* إدخال معرّف الجلسة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-cairo">
            معرّف الجلسة
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionId}
              onChange={handleSessionIdChange}
              placeholder="أدخل معرّف الجلسة"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-cairo"
            />
            <button
              onClick={fetchTasks}
              disabled={loadingTasks}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-cairo"
            >
              {loadingTasks ? 'جارٍ التحميل...' : 'تحميل المهام'}
            </button>
          </div>
        </div>

        {/* تتبع الموقع */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 font-cairo">تتبع الموقع</h2>

          {geoError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4 font-cairo">
              خطأ: {geoError}
            </div>
          ) : position ? (
            <div className="space-y-2 mb-4">
              <div>
                <span className="text-sm text-gray-600 font-cairo">خط العرض:</span>
                <p className="font-mono">{position.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-cairo">خط الطول:</span>
                <p className="font-mono">{position.longitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 font-cairo">الدقة:</span>
                <p className="font-cairo">{Math.round(position.accuracy)} متر</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 mb-4 font-cairo">جارٍ تحديد الموقع...</p>
          )}

          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!connected}
            className={`w-full px-6 py-3 text-white rounded-md font-semibold font-cairo ${
              isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isTracking ? 'إيقاف التتبع' : 'بدء التتبع'}
          </button>
        </div>

        {/* المهام */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 font-cairo">مهام التوصيل ({tasks.length})</h2>

          {tasks.length === 0 ? (
            <p className="text-gray-600 text-center py-8 font-cairo">لا توجد مهام مُسندة بعد</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 font-cairo">{task.vendorName}</h3>
                      <p className="text-sm text-gray-600 mt-1 font-cairo">
                        {task.items} عنصر للجمع
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        task.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {task.status === 'completed'
                        ? 'مكتمل'
                        : task.status === 'in-progress'
                          ? 'قيد التنفيذ'
                          : 'معلق'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in-progress')}
                      disabled={task.status !== 'pending'}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-cairo"
                    >
                      بدء
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      disabled={task.status === 'completed'}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-cairo"
                    >
                      إتمام
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
