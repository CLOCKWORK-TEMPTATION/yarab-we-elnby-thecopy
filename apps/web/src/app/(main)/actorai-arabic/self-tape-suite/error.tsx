'use client';

/**
 * حدود الخطأ لـ Self-Tape Suite
 */
export default function SelfTapeSuiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-bl from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">حدث خطأ</h2>
        <p className="text-gray-300 mb-6">
          {error.message || 'حدث خطأ غير متوقع في Self-Tape Suite.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
