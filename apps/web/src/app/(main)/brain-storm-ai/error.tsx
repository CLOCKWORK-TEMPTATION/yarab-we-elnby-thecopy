'use client';

/**
 * حدود الخطأ لمنصة العصف الذهني
 * يُعرض عند حدوث خطأ غير متوقع
 */
export default function BrainStormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">حدث خطأ</h2>
          <p className="text-muted-foreground mb-6">
            {error.message || 'حدث خطأ غير متوقع في منصة العصف الذهني.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}