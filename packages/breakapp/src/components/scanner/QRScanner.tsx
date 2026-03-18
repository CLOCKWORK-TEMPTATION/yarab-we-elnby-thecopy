'use client';

/**
 * مكون ماسح QR - QR Scanner Component
 * 
 * @description
 * يستخدم كاميرا الجهاز لمسح رموز QR للمصادقة
 * والانضمام للمشاريع السينمائية
 * 
 * السبب: مسح QR هو الطريقة الأسرع لإضافة أعضاء الفريق
 * للمشروع دون الحاجة لإنشاء حسابات معقدة
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * خصائص مكون ماسح QR
 */
interface QRScannerProps {
  /** دالة تُستدعى عند مسح رمز QR بنجاح */
  onScan: (decodedText: string) => void;
  /** دالة تُستدعى عند حدوث خطأ (اختياري) */
  onError?: (error: string) => void;
}

/**
 * خطأ الماسح
 * 
 * @description
 * يوسّع نوع Error لتوفير تصنيف أوضح لأخطاء مسح QR
 * مما يسهل معالجة الأخطاء المحددة للكاميرا والمسح
 */
interface ScannerError extends Error {
  name: string;
  message: string;
}

/**
 * مكون ماسح رموز QR
 * 
 * @description
 * يعرض واجهة لمسح رموز QR مع أزرار تشغيل/إيقاف
 * وعرض الأخطاء بشكل واضح للمستخدم
 * 
 * @example
 * ```tsx
 * <QRScanner
 *   onScan={(code) => console.log('تم المسح:', code)}
 *   onError={(err) => console.error('خطأ:', err)}
 * />
 * ```
 */
export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'qr-scanner-region';

  // التنظيف عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {
          // تجاهل أخطاء الإيقاف عند التنظيف
        });
      }
    };
  }, []);

  /**
   * إيقاف المسح
   */
  const stopScanning = useCallback(async (): Promise<void> => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        setIsScanning(false);
      }
    } catch {
      // تجاهل أخطاء الإيقاف - قد يكون الماسح متوقفاً بالفعل
    }
  }, []);

  /**
   * بدء المسح
   */
  const startScanning = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(elementId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // أخطاء المسح المتكررة طبيعية - لا حاجة لمعالجتها
        }
      );

      setIsScanning(true);
    } catch (err: unknown) {
      const scannerError = err as ScannerError;
      const errorMsg = scannerError?.message || 'فشل في تشغيل الكاميرا';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [onScan, onError, stopScanning]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* منطقة عرض الكاميرا */}
      <div 
        id={elementId} 
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{ minHeight: isScanning ? '300px' : '0' }}
      />
      
      {/* عرض الخطأ */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg max-w-md w-full">
          <p className="text-sm font-medium">خطأ</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* أزرار التحكم */}
      <div className="flex gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            بدء المسح
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            إيقاف المسح
          </button>
        )}
      </div>

      {/* تعليمات المسح */}
      {isScanning && (
        <div className="text-sm text-gray-600 text-center max-w-md">
          <p>ضع رمز QR داخل الإطار</p>
          <p className="text-xs mt-1">تأكد من وجود إضاءة جيدة وأن الرمز واضح</p>
        </div>
      )}
    </div>
  );
}
