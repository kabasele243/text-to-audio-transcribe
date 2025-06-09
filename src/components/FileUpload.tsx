
import React, { useCallback, useState } from 'react';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
      event.target.value = ''; // Reset file input
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`w-full p-6 border-2 border-dashed rounded-lg transition-colors duration-200 ease-in-out
                  ${isDragging ? 'border-sky-500 bg-sky-900/30' : 'border-slate-600 hover:border-slate-500'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDrop={!isLoading ? handleDrop : undefined}
      onDragOver={!isLoading ? handleDragOver : undefined}
      onDragEnter={!isLoading ? handleDragEnter : undefined}
      onDragLeave={!isLoading ? handleDragLeave : undefined}
    >
      <input
        type="file"
        id="fileUpload"
        multiple
        accept=".txt,.zip,application/zip,text/plain"
        onChange={!isLoading ? handleFileChange : undefined}
        className="hidden"
        disabled={isLoading}
      />
      <label htmlFor="fileUpload" className={`flex flex-col items-center justify-center space-y-3 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
        <ArrowUpTrayIcon className={`w-12 h-12 ${isDragging ? 'text-sky-400' : 'text-slate-500'}`} />
        <p className={`text-lg font-medium ${isDragging ? 'text-sky-300' : 'text-slate-300'}`}>
          Drag & drop files here, or click to select
        </p>
        <p className={`text-sm ${isDragging ? 'text-sky-400' : 'text-slate-500'}`}>
          Supports .txt and .zip files
        </p>
      </label>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 rounded-lg">
           {/* Spinner could go here if a separate spinner component exists and is desired */}
        </div>
      )}
    </div>
  );
};
