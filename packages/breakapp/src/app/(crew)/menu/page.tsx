'use client';

/**
 * صفحة قائمة الطعام للطاقم - Crew Menu Page
 * 
 * @description
 * تتيح لأعضاء الطاقم طلب الطعام من الموردين المتاحين
 * أثناء جلسة التصوير
 * 
 * السبب: توفير وسيلة سهلة لطلب الطعام دون مغادرة موقع التصوير
 * مما يحافظ على سير العمل بسلاسة
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import type { MenuItem, OrderItem, Order, Vendor } from '../../../lib/types';

/**
 * صفحة طلب الطعام للطاقم
 * 
 * @description
 * تعرض قائمة الموردين وعناصر الطعام
 * مع إمكانية إضافتها للسلة وتقديم الطلب
 */
export default function CrewMenuPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  const apiUrl = useMemo(() => 
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    []
  );

  /**
   * جلب الموردين من الخادم
   */
  const fetchVendors = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get<Vendor[]>(`${apiUrl}/vendors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setVendors(response.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في جلب الموردين:', axiosError.message);
    }
  }, [apiUrl]);

  /**
   * جلب طلباتي من الخادم
   */
  const fetchMyOrders = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get<Order[]>(`${apiUrl}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMyOrders(response.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في جلب الطلبات:', axiosError.message);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchVendors();
    fetchMyOrders();
  }, [fetchVendors, fetchMyOrders]);

  /**
   * جلب قائمة الطعام من مورد محدد
   */
  const fetchMenu = useCallback(async (vendorId: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await axios.get<MenuItem[]>(`${apiUrl}/vendors/${vendorId}/menu`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setMenuItems(response.data);
      setSelectedVendor(vendorId);
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في جلب القائمة:', axiosError.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  /**
   * إضافة عنصر للسلة
   */
  const addToCart = useCallback((menuItemId: string): void => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItemId === menuItemId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { menuItemId, quantity: 1 }];
    });
  }, []);

  /**
   * إزالة عنصر من السلة
   */
  const removeFromCart = useCallback((menuItemId: string): void => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItemId === menuItemId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter((item) => item.menuItemId !== menuItemId);
    });
  }, []);

  /**
   * تقديم الطلب
   */
  const submitOrder = useCallback(async (): Promise<void> => {
    if (!sessionId || cart.length === 0) {
      alert('يرجى إدخال معرّف الجلسة وإضافة عناصر للسلة');
      return;
    }

    setLoading(true);
    try {
      // الحصول على أو إنشاء معرّف المستخدم
      let userHash = localStorage.getItem('userHash');
      if (!userHash) {
        userHash = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('userHash', userHash);
      }

      await axios.post(
        `${apiUrl}/orders`,
        {
          sessionId,
          userHash,
          items: cart,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      alert('تم تقديم الطلب بنجاح!');
      setCart([]);
      fetchMyOrders();
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      console.error('خطأ في تقديم الطلب:', axiosError.message);
      alert('فشل في تقديم الطلب');
    } finally {
      setLoading(false);
    }
  }, [sessionId, cart, apiUrl, fetchMyOrders]);

  /**
   * الحصول على كمية عنصر في السلة
   */
  const getItemQuantityInCart = useCallback((menuItemId: string): number => {
    const item = cart.find((i) => i.menuItemId === menuItemId);
    return item ? item.quantity : 0;
  }, [cart]);

  /**
   * معالج تغيير معرّف الجلسة
   */
  const handleSessionIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSessionId(e.target.value);
  }, []);

  /**
   * ترجمة حالة الطلب
   */
  const getOrderStatusLabel = useCallback((status: Order['status']): string => {
    const labels: Record<Order['status'], string> = {
      pending: 'معلق',
      processing: 'قيد المعالجة',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    };
    return labels[status];
  }, []);

  /**
   * لون حالة الطلب
   */
  const getOrderStatusColor = useCallback((status: Order['status']): string => {
    const colors: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">قائمة الطلبات</h1>
          <p className="text-gray-600">اختر العناصر من الموردين المتاحين</p>
        </div>

        {/* إدخال معرّف الجلسة */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            معرّف الجلسة (من المخرج)
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={handleSessionIdChange}
            placeholder="أدخل معرّف الجلسة"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* قائمة الموردين */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">الموردون المتاحون</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => fetchMenu(vendor.id)}
                className={`p-4 border rounded-lg text-right hover:shadow-md transition-shadow ${
                  selectedVendor === vendor.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {vendor.is_mobile ? 'متنقل' : 'موقع ثابت'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* عناصر القائمة */}
        {menuItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">عناصر القائمة</h2>
            <div className="space-y-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getItemQuantityInCart(item.id) > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">
                          {getItemQuantityInCart(item.id)}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => addToCart(item.id)}
                      disabled={!item.available}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {getItemQuantityInCart(item.id) === 0 ? 'إضافة' : '+'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* السلة */}
        {cart.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">طلبك ({cart.length} عناصر)</h2>
            <div className="space-y-2 mb-4">
              {cart.map((item) => {
                const menuItem = menuItems.find((m) => m.id === item.menuItemId);
                return (
                  <div key={item.menuItemId} className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {menuItem?.name || 'عنصر غير معروف'}
                    </span>
                    <span className="font-semibold">x{item.quantity}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={submitOrder}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'جارٍ الإرسال...' : 'تقديم الطلب'}
            </button>
          </div>
        )}

        {/* طلباتي */}
        {myOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">طلباتي</h2>
            <div className="space-y-4">
              {myOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString('ar-SA')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {order.items.length} عنصر
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
