import React from 'react';
import type { ProcessedFile } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { SpeakerWaveIcon } from './icons/SpeakerWaveIcon';

interface FileListItemProps {
  file: ProcessedFile;
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


export const FileListItem: React.FC<FileListItemProps> = ({ file }) => {
  const isZipEntry = file.name.includes('/') || file.name.endsWith('.txt') && !file.name.startsWith('blob:'); // Heuristic for zip entries vs top-level zips

  const FileIcon = () => {
    if (file.name.endsWith('.zip') && !isZipEntry) {
      return <ArchiveBoxIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />;
    }
    return <DocumentTextIcon className="w-6 h-6 text-sky-400 flex-shrink-0" />;
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
