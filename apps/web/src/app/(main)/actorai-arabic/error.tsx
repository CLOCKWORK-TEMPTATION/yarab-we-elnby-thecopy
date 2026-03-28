'use client';

/**
 * حدود الخطأ لاستوديو الممثل الذكي
 * يُعرض عند حدوث خطأ غير متوقع
 */
export default function ActorAiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-destructive mb-4">حدث خطأ</h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'حدث خطأ غير متوقع في استوديو الممثل.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
