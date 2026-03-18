/**
 * @the-copy/breakapp - BREAKAPP Package
 *
 * Film production management business logic extracted from the BREAKAPP app.
 * Re-exports all public modules: types, auth utilities, hooks, and components.
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  JWTPayload,
  AuthResponse,
  CurrentUser,
  ConnectionState,
  ConnectionStatus,
  SocketConnectionOptions,
  LocationPosition,
  GeolocationOptions,
  Vendor,
  VendorMapData,
  MenuItem,
  OrderItem,
  Order,
  DeliveryTask,
  ApiError,
  ApiResponse,
} from './lib/types';

export {
  JWTPayloadSchema,
  QRTokenSchema,
  AuthResponseSchema,
  ScanQRRequestSchema,
} from './lib/types';

// ── Auth / API utilities ─────────────────────────────────────────────────────
export {
  storeToken,
  getToken,
  removeToken,
  isAuthenticated,
  getCurrentUser,
  scanQRAndLogin,
  verifyToken,
  generateDeviceHash,
  api,
} from './lib/auth';

// ── Hooks ────────────────────────────────────────────────────────────────────
export { useGeolocation } from './hooks/useGeolocation';
export { useSocket } from './hooks/useSocket';

// ── Components ───────────────────────────────────────────────────────────────
export { default as ConnectionTest } from './components/ConnectionTest';
export { default as MapComponent } from './components/maps/MapComponent';
export { default as QRScanner } from './components/scanner/QRScanner';

// ── Page components (re-exported for composition in host apps) ───────────────
// These are 'use client' Next.js pages. Import them directly when needed:
//   import QRLoginPage     from '@the-copy/breakapp/src/app/(auth)/login/qr/page';
//   import CrewMenuPage    from '@the-copy/breakapp/src/app/(crew)/menu/page';
//   import DirectorDashboard from '@the-copy/breakapp/src/app/(dashboard)/director/page';
//   import RunnerTrackPage from '@the-copy/breakapp/src/app/(runner)/track/page';
//   import DashboardPage   from '@the-copy/breakapp/src/app/dashboard/page';
