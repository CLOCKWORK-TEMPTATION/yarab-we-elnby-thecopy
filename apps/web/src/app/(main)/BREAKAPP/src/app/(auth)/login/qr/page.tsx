'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@the-copy/breakapp';
import { scanQRAndLogin, storeToken, generateDeviceHash } from '@the-copy/breakapp';

export default function QRLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleQRScan = async (qrToken: string) => {
    try {
      setLoading(true);
      setError(null);

      // Validate QR token format
      const parts = qrToken.split(':');
      if (parts.length !== 3) {
        setError('Invalid QR code format');
        setLoading(false);
        return;
      }

      // Generate device hash
      const deviceHash = generateDeviceHash();

      // Authenticate with backend
      const result = await scanQRAndLogin(qrToken, deviceHash);

      // Store token
      storeToken(result.access_token);

      // Show success
      setSuccess(true);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to authenticate';
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleScanError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Break Break
          </h1>
          <p className="text-gray-600">
            Scan QR code to join your project
          </p>
        </div>

        {success ? (
          <div className="text-center p-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">
              Redirecting to dashboard...
            </p>
          </div>
        ) : (
          <>
            <QRScanner onScan={handleQRScan} onError={handleScanError} />

            {loading && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Authenticating...</p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="text-sm font-medium">Authentication Failed</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Make sure you have permission to access the camera</p>
      </div>
    </div>
  );
}
