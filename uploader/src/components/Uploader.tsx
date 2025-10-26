'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  s3Key?: string;
}

interface UploaderProps {
  onUploadComplete?: (files: FileWithProgress[]) => void;
}

export const Uploader = ({ onUploadComplete }: UploaderProps) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (file.size === 0) {
        console.warn(`Skipping empty file: ${file.name}`);
        return false;
      }
      return true;
    });
    
    const newFiles: FileWithProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/calendar': ['.ics'],
      'text/csv': ['.csv'],
      'message/rfc822': ['.eml'],
      'application/mbox': ['.mbox'],
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Step 1: Get presigned URLs
      const fileData = files.map(f => ({
        originalName: f.file.name,
        mimeType: f.file.type,
        byteSize: f.file.size,
      }));
      
      console.log('Sending file data:', fileData);
      
      const presignedResponse = await fetch('/api/upload/create-presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData }),
      });

      if (!presignedResponse.ok) {
        const errorData = await presignedResponse.json();
        console.error('Presigned URL error:', errorData);
        throw new Error(errorData.error || 'Failed to get presigned URLs');
      }

      const { results } = await presignedResponse.json();

      // Step 2: Upload files to S3
      const uploadPromises = files.map(async (fileWithProgress, index) => {
        const presignedData = results[index];
        
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'uploading' } : f
        ));

        try {
          console.log('Uploading file:', fileWithProgress.file.name);
          console.log('Presigned URL:', presignedData.presignedUrl);
          console.log('File size:', fileWithProgress.file.size);
          console.log('File type:', fileWithProgress.file.type);
          
          const response = await fetch(presignedData.presignedUrl, {
            method: 'PUT',
            body: fileWithProgress.file,
            headers: {
              'Content-Type': fileWithProgress.file.type,
            },
          });

          console.log('Upload response status:', response.status);
          console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed with response:', errorText);
            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
          }

          setFiles(prev => prev.map((f, i) => 
            i === index ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              s3Key: presignedData.s3Key 
            } : f
          ));

          return presignedData;
        } catch (error) {
          setFiles(prev => prev.map((f, i) => 
            i === index ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } : f
          ));
          throw error;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);

      // Step 3: Complete upload
      const successfulUploads = uploadResults.filter(result => result !== undefined);
      if (successfulUploads.length > 0) {
        console.log('Completing upload for files:', successfulUploads.length);
        
        const completeResponse = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: successfulUploads.map(result => ({
              s3Key: result.s3Key,
              originalName: result.originalName,
              mimeType: result.mimeType,
              byteSize: result.byteSize,
            })),
          }),
        });

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json();
          console.error('Complete upload error:', errorData);
          throw new Error(errorData.error || 'Failed to complete upload');
        }

        const completeData = await completeResponse.json();
        console.log('Upload completed successfully:', completeData);
      }

      onUploadComplete?.(files);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const canUpload = files.length > 0 && files.every(f => f.status === 'pending' || f.status === 'completed');
  const hasErrors = files.some(f => f.status === 'error');

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg text-gray-600">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Supports: TXT, MD, PDF, DOCX, ICS, CSV, EML, MBOX (max 25MB each)
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-900">Files to Upload</h3>
          {files.map((fileWithProgress, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileWithProgress.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(fileWithProgress.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {fileWithProgress.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${fileWithProgress.progress}%` }}
                    ></div>
                  </div>
                )}
                {fileWithProgress.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{fileWithProgress.error}</p>
                )}
                {fileWithProgress.status === 'completed' && (
                  <p className="text-xs text-green-600 mt-1">✓ Uploaded successfully</p>
                )}
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 text-red-600 hover:text-red-800"
                disabled={fileWithProgress.status === 'uploading'}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setFiles([])}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isUploading}
          >
            Clear All
          </button>
          <button
            onClick={uploadFiles}
            disabled={!canUpload || isUploading}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              canUpload && !isUploading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}

      {hasErrors && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            Some files failed to upload. Please check the errors above and try again.
          </p>
        </div>
      )}
    </div>
  );
};
