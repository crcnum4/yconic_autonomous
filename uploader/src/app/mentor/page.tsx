'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { MentorChat } from '@/components/MentorChat';

export default function MentorPage() {
  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Mentor</h1>
          <p className="mt-2 text-gray-600">
            Ask questions about your startup based on your uploaded documents
          </p>
        </div>

        <div className="bg-white rounded-lg shadow" style={{ height: 'calc(100vh - 250px)' }}>
          <MentorChat />
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How to use:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Make sure you've uploaded your documents (meeting minutes, emails, calendar) in the Dashboard</li>
            <li>Ensure the Python API is running: <code className="bg-blue-100 px-1 rounded">python api.py</code></li>
            <li>Ask questions about your startup, and the AI will analyze your documents to provide insights</li>
            <li>The AI uses evaluation rubrics to provide strategic advice and identify opportunities</li>
          </ol>
        </div>
      </div>
    </AuthGuard>
  );
}
