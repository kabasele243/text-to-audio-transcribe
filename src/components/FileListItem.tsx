import React from 'react';
import type { ProcessedFile } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface FileListItemProps {
  file: ProcessedFile;
  onRefetchAudio?: (file: ProcessedFile) => Promise<void>;
  isRefetching?: boolean;
  onDownload?: (file: ProcessedFile) => Promise<void>;
}

const StatusIndicator: React.FC<{ status: ProcessedFile['status'] }> = ({ status }) => {
  switch (status) {
    case 'pending':
    case 'ready':
      return (
        <span title="Ready for transcription">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
        </span>
      );
    case 'processing':
      return (
        <span title="Processing">
          <ArrowPathIcon className="w-5 h-5 text-sky-400 animate-spin" />
        </span>
      );
    case 'transcribed':
      return (
        <span title="Transcribed">
          <CheckCircleIcon className="w-5 h-5 text-green-400" />
        </span>
      );
    case 'error':
      return (
        <span title="Error">
          <XCircleIcon className="w-5 h-5 text-red-400" />
        </span>
      );
    default:
      return null;
  }
};


export const FileListItem: React.FC<FileListItemProps> = ({ file, onRefetchAudio, isRefetching, onDownload }) => {
  const isZipEntry = file.name.includes('/') || file.name.endsWith('.txt') && !file.name.startsWith('blob:'); // Heuristic for zip entries vs top-level zips
  const needsAudioRestoration = file.status === 'transcribed' && (!file.audioSrc || file.audioSrc === '');

  const FileIcon = () => {
    if (file.name.endsWith('.zip') && !isZipEntry) {
      return <ArchiveBoxIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />;
    }
    return <DocumentTextIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />;
  };

  const handleRefetchClick = async () => {
    if (onRefetchAudio && !isRefetching) {
      await onRefetchAudio(file);
    }
  };

  const handleDownloadClick = async () => {
    if (onDownload) {
      await onDownload(file);
    }
  };

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg shadow-md flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <FileIcon />
        <span className="text-slate-200 font-medium truncate" title={file.name}>
          {file.name}
        </span>
      </div>
      
      <div className="flex items-center space-x-2 w-full sm:w-auto sm:justify-end">
         <div className="flex-shrink-0">
            <StatusIndicator status={file.status} />
         </div>
        {file.status === 'transcribed' && file.audioSrc && (
          <div className="flex items-center space-x-2 text-green-400">
             <SpeakerWaveIcon className="w-5 h-5" />
             <audio controls src={file.audioSrc} className="h-8 max-w-[150px] sm:max-w-[200px]">
                Your browser does not support the audio element.
             </audio>
             {onDownload && (
               <button
                 onClick={handleDownloadClick}
                 className="px-2 py-1 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-sm transition-colors flex items-center space-x-1"
                 title="Download audio file"
               >
                 <DownloadIcon className="w-3 h-3" />
                 <span>Download</span>
               </button>
             )}
          </div>
        )}
        {needsAudioRestoration && onRefetchAudio && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefetchClick}
              disabled={isRefetching}
              className="px-3 py-1 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
              title="Re-fetch audio file"
            >
              {isRefetching ? (
                <>
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  <span>Restoring...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-3 h-3" />
                  <span>Restore Audio</span>
                </>
              )}
            </button>
          </div>
        )}
         {file.status === 'processing' && (
             <span className="text-xs text-sky-400">Processing...</span>
         )}
         {file.status === 'ready' && (
             <span className="text-xs text-yellow-400">Ready</span>
         )}
      </div>
      {file.status === 'error' && file.error && (
        <div className="w-full mt-2 sm:mt-0 sm:ml-auto sm:pl-4 sm:border-l sm:border-slate-600">
            <p className="text-xs text-red-400 truncate" title={file.error}>
                Error: {file.error}
            </p>
        </div>
      )}
    </div>
  );
};
