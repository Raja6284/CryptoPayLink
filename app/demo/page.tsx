'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DemoPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Prevent hydration mismatch
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-4 py-6 sm:px-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm text-blue-600 hover:underline w-max"
      >
        ← Back
      </button>

      {/* Content */}
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">CryptoPayLink Demo</h1>
        <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-2xl">
          Explore how to create shareable payment links, accept crypto, and get paid directly to your wallet.
        </p>
        <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 sm:p-8">
          {/* Add your demo content here */}
          <p className="text-gray-700">DEMO will be added here in some time, I am working on it...</p>
        </div>
      </div>
    </div>
  );
}
