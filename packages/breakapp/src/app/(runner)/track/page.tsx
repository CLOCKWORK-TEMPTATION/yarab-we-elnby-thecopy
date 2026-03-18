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
import { useGeolocation } from '../../../hooks/useGeolocation';
import { useSocket } from '../../../hooks/useSocket';
import axios, { AxiosError } from 'axios';
import type { DeliveryTask } from '../../../lib/types';

/**
 * استجابة API للمهام المجمّعة
 * 
 * @description
 * يمثل صيغة الاستجابة من نقطة النهاية /orders/session/:id/batch
 * التي تُرجع مهام التوصيل مُجمّعة حسب البائع
 */
interface BatchTaskResponse {
  vendorId: string;
  vendorName: string;
  totalItems: number;
}

/**
 * صفحة لوحة تحكم Runner
 * 
 * @description
 * تعرض موقع Runner الحالي ومهام التوصيل
 * مع إمكانية تحديث حالة كل مهمة
 */
export default function RunnerTrackPage() {
  const [runnerId, setRunnerId] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  
  const { position, error: geoError } = useGeolocation();
  const { connected, emit, on, off } = useSocket();

  const apiUrl = useMemo(() => 
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    []
  );

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
  }, []);

  /**
   * إيقاف تتبع الموقع
   */
  const stopTracking = useCallback((): void => {
    setIsTracking(false);
  }, []);

  /**
   * جلب المهام من الخادم
   */
  const fetchTasks = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      alert('يرجى إدخال معرّف الجلسة');
      return;
    }

    try {
      const response = await axios.post<BatchTaskResponse[]>(
        `${apiUrl}/orders/session/${sessionId}/batch`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const batchedTasks: DeliveryTask[] = response.data.map((batch) => ({
        id: batch.vendorId,
        vendorName: batch.vendorName,
        items: batch.totalItems,
        status: 'pending' as const,
      }));

      setTasks(batchedTasks);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في جلب المهام:', axiosError.message);
      alert('فشل في جلب المهام');
    }
  }, [sessionId, apiUrl]);

  /**
   * تحديث حالة المهمة
   */
  const updateTaskStatus = useCallback((
    taskId: string, 
    status: 'pending' | 'in-progress' | 'completed'
  ): void => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => 
        task.id === taskId ? { ...task, status } : task
      )
    );

    if (connected) {
      emit('order:status', { orderId: taskId, status });
    }
  }, [connected, emit]);

  /**
   * معالج تغيير معرّف الجلسة
   */
  const handleSessionIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSessionId(e.target.value);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة تحكم Runner</h1>
          <p className="text-gray-600">تتبع موقعك وإدارة مهام التوصيل</p>
        </div>

        {/* معلومات Runner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">معلومات Runner</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">معرّف Runner:</span>
              <p className="font-mono text-sm">{runnerId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">حالة الاتصال:</span>
              <span
                className={`mr-2 px-2 py-1 text-xs rounded-full ${
                  connected
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {connected ? 'متصل' : 'غير متصل'}
              </span>
            </div>
          </div>
        </div>

        {/* إدخال معرّف الجلسة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            معرّف الجلسة
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sessionId}
              onChange={handleSessionIdChange}
              placeholder="أدخل معرّف الجلسة"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={fetchTasks}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              تحميل المهام
            </button>
          </div>
        </div>

        {/* تتبع الموقع */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">تتبع الموقع</h2>
          
          {geoError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
              خطأ: {geoError}
            </div>
          ) : position ? (
            <div className="space-y-2 mb-4">
              <div>
                <span className="text-sm text-gray-600">خط العرض:</span>
                <p className="font-mono">{position.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">خط الطول:</span>
                <p className="font-mono">{position.longitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">الدقة:</span>
                <p>{Math.round(position.accuracy)} متر</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 mb-4">جارٍ تحديد الموقع...</p>
          )}

          <button
            onClick={isTracking ? stopTracking : startTracking}
            disabled={!connected}
            className={`w-full px-6 py-3 text-white rounded-md font-semibold ${
              isTracking
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isTracking ? 'إيقاف التتبع' : 'بدء التتبع'}
          </button>
        </div>

        {/* المهام */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">مهام التوصيل ({tasks.length})</h2>
          
          {tasks.length === 0 ? (
            <p className="text-gray-600 text-center py-8">لا توجد مهام مُسندة بعد</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.vendorName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
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
                      {task.status === 'completed' ? 'مكتمل' : 
                       task.status === 'in-progress' ? 'قيد التنفيذ' : 'معلق'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTaskStatus(task.id, 'in-progress')}
                      disabled={task.status !== 'pending'}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      بدء
                    </button>
                    <button
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      disabled={task.status === 'completed'}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
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
