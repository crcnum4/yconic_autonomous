'use client';

import { useState, useCallback } from 'react';

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  s3Key?: string;
}

interface UseUploaderReturn {
  files: FileWithProgress[];
  isUploading: boolean;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  uploadFiles: () => Promise<void>;
  clearFiles: () => void;
  canUpload: boolean;
}

export const useUploader = (): UseUploaderReturn => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    const fileObjects: FileWithProgress[] = newFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
    }));
    
    setFiles(prev => [...prev, ...fileObjects]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const uploadFiles = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Step 1: Get presigned URLs
      const presignedResponse = await fetch('/api/upload/create-presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map(f => ({
            originalName: f.file.name,
            mimeType: f.file.type,
            byteSize: f.file.size,
          })),
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get presigned URLs');
      }

      const { results } = await presignedResponse.json();

      // Step 2: Upload files to S3
      const uploadPromises = files.map(async (fileWithProgress, index) => {
        const presignedData = results[index];
        
        setFiles(prev => prev.map((f, i) => 
          i === index ? { ...f, status: 'uploading' } : f
        ));

        try {
          const response = await fetch(presignedData.presignedUrl, {
            method: 'PUT',
            body: fileWithProgress.file,
            headers: {
              'Content-Type': fileWithProgress.file.type,
            },
          });

          if (!response.ok) {
            throw new Error('Upload failed');
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

      await Promise.all(uploadPromises);

      // Step 3: Complete upload
      const completedFiles = files.filter(f => f.status === 'completed');
      if (completedFiles.length > 0) {
        await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: completedFiles.map(f => ({
              s3Key: f.s3Key!,
              originalName: f.file.name,
              mimeType: f.file.type,
              byteSize: f.file.size,
            })),
          }),
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  const canUpload = files.length > 0 && files.every(f => f.status === 'pending' || f.status === 'completed');

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadFiles,
    clearFiles,
    canUpload,
  };
};
