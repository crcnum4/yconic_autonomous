'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Uploader } from '@/components/Uploader';
import { DocumentsTable } from '@/components/DocumentsTable';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    // Trigger refresh of documents table
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Upload and manage your documents
          </p>
        </div>

        <div className="space-y-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
            <Uploader onUploadComplete={handleUploadComplete} />
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Documents</h2>
            <DocumentsTable refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
