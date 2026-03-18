// حزمة @the-copy/actorai
// نقطة الدخول الرئيسية — أعد تصدير كل المكونات العامة هنا

// Components
export { ActorAiArabicStudio } from './components/ActorAiArabicStudio';
export { VoiceCoach } from './components/VoiceCoach';

// Hooks
export {
  useVoiceAnalytics,
  useNotification,
  useMemorization,
  useWebcamAnalysis,
} from './hooks';
export type {
  VoiceMetrics,
  VoiceAnalyticsState,
  UseNotificationReturn,
  MemorizationState,
  UseMemorizationReturn,
  DeletionLevel,
  WebcamState,
  WebcamPermission,
  UseWebcamAnalysisReturn,
} from './hooks';

// Self-Tape Suite
export { SelfTapeSuite } from './self-tape-suite/components/SelfTapeSuite';

// Types
export * from './types';
export * from './types/constants';
