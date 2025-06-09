import React, { useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileUpload } from './components/FileUpload';
import { FileListItem } from './components/FileListItem';
import { SettingsControls } from './components/SettingsControls';
import type { ProcessedFile } from './types';
import { ArrowUpTrayIcon } from './components/icons/ArrowUpTrayIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  setIsReadingFiles,
  setIsDownloading,
  addProcessedFiles,
  transcribeMultipleFiles,
  clearAllFiles,
  clearError,
} from './store/slices/filesSlice';
import {
  loadVoices,
  setSelectedVoice,
  setSelectedSpeed,
} from './store/slices/settingsSlice';
import {
  setGlobalMessage,
  clearGlobalMessage,
} from './store/slices/uiSlice';
import {
  selectProcessedFiles,
  selectIsReadingFiles,
  selectIsTranscribing,
  selectIsDownloading,
  selectSelectedVoice,
  selectAvailableVoices,
  selectSelectedSpeed,
  selectIsLoadingVoices,
  selectGlobalMessage,
  selectCanTranscribe,
  selectCanClear,
  selectCanDownload,
  selectReadyFiles,
  selectTranscribedFiles,
  selectTranscriptionProgress,
} from './store/selectors';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // RTK Best Practice: Use memoized selectors
  const processedFiles = useAppSelector(selectProcessedFiles);
  const isReadingFiles = useAppSelector(selectIsReadingFiles);
  const isTranscribing = useAppSelector(selectIsTranscribing);
  const isDownloading = useAppSelector(selectIsDownloading);
  const selectedVoice = useAppSelector(selectSelectedVoice);
  const availableVoices = useAppSelector(selectAvailableVoices);
  const selectedSpeed = useAppSelector(selectSelectedSpeed);
  const isLoadingVoices = useAppSelector(selectIsLoadingVoices);
  const globalMessage = useAppSelector(selectGlobalMessage);
  const transcriptionProgress = useAppSelector(selectTranscriptionProgress);
  
  // RTK Best Practice: Use computed selectors for derived state
  const canTranscribe = useAppSelector(selectCanTranscribe);
  const canClear = useAppSelector(selectCanClear);
  const canDownload = useAppSelector(selectCanDownload);
  const readyFiles = useAppSelector(selectReadyFiles);

  useEffect(() => {
    dispatch(loadVoices());
  }, [dispatch]);

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  };

  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    dispatch(setIsReadingFiles(true));
    dispatch(setGlobalMessage(`Reading ${files.length} item(s)...`));
    dispatch(clearError()); // Clear any previous errors

    const newFilesToProcess: ProcessedFile[] = [];

    try {
      for (const file of files) {
        dispatch(setGlobalMessage(`Processing ${file.name}...`));
        
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          try {
            const content = await readFileContent(file);
            newFilesToProcess.push({
              id: crypto.randomUUID(),
              name: file.name,
              content,
              status: 'ready',
            });
          } catch (error) {
            console.error(`Error reading file ${file.name}:`, error);
            newFilesToProcess.push({
              id: crypto.randomUUID(),
              name: file.name,
              content: '',
              status: 'error',
              error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
          try {
            const jszip = new JSZip();
            const zip = await jszip.loadAsync(file);
            const textFilePromises: Promise<ProcessedFile>[] = [];
            
            zip.forEach((_, zipEntry) => {
              if (!zipEntry.dir && (zipEntry.name.endsWith('.txt') || zipEntry.name.endsWith('.TXT'))) {
                dispatch(setGlobalMessage(`Extracting ${zipEntry.name} from ${file.name}...`));
                const promise = zipEntry.async('string').then(content => ({
                  id: crypto.randomUUID(),
                  name: zipEntry.name,
                  content,
                  status: 'ready' as const,
                })).catch(err => {
                  console.error(`Error reading ${zipEntry.name} from zip:`, err);
                  return {
                    id: crypto.randomUUID(),
                    name: zipEntry.name,
                    content: '',
                    status: 'error' as const,
                    error: `Failed to read from ZIP: ${err instanceof Error ? err.message : String(err)}`
                  };
                });
                textFilePromises.push(promise);
              }
            });
            
            const filesFromZip = await Promise.all(textFilePromises);
            newFilesToProcess.push(...filesFromZip);
          } catch (error) {
            console.error(`Error processing zip file ${file.name}:`, error);
            newFilesToProcess.push({
              id: crypto.randomUUID(),
              name: file.name,
              content: '',
              status: 'error',
              error: `Failed to process ZIP: ${error instanceof Error ? error.message : String(error)}`,
            });
          }
        } else {
          newFilesToProcess.push({
            id: crypto.randomUUID(),
            name: file.name,
            content: '',
            status: 'error',
            error: 'Unsupported file type. Please upload .txt or .zip files.',
          });
        }
      }
      
      dispatch(addProcessedFiles(newFilesToProcess));
    } catch (error) {
      console.error('Error during file processing:', error);
      dispatch(setGlobalMessage('An error occurred while processing files.'));
    } finally {
      dispatch(setIsReadingFiles(false));
      dispatch(clearGlobalMessage());
    }
  }, [dispatch]);

  const handleStartTranscription = useCallback(async () => {
    if (readyFiles.length === 0) return;

    dispatch(setGlobalMessage(`Starting transcription of ${readyFiles.length} file(s)...`));

    try {
      await dispatch(transcribeMultipleFiles({ 
        files: readyFiles, 
        voice: selectedVoice, 
        speed: selectedSpeed 
      })).unwrap();
      
      dispatch(setGlobalMessage("All transcriptions completed successfully!"));
      setTimeout(() => dispatch(clearGlobalMessage()), 5000);
    } catch (error) {
      console.error('Error during bulk transcription:', error);
      dispatch(setGlobalMessage("Some transcriptions failed. Please check individual file statuses."));
      setTimeout(() => dispatch(clearGlobalMessage()), 5000);
    }
  }, [dispatch, selectedVoice, selectedSpeed, readyFiles]);

  const handleDownloadAll = useCallback(async () => {
    const transcribedFiles = useAppSelector(selectTranscribedFiles);
    if (transcribedFiles.length === 0) return;

    dispatch(setIsDownloading(true));
    dispatch(setGlobalMessage('Preparing ZIP file for download...'));

    try {
      const zip = new JSZip();
      
      // Download all audio files and add them to the zip
      const downloadPromises = transcribedFiles.map(async (file: ProcessedFile) => {
        if (!file.audioSrc) return;
        
        try {
          const response = await fetch(file.audioSrc);
          if (!response.ok) throw new Error(`Failed to download ${file.name}`);
          
          const audioBlob = await response.blob();
          const audioFileName = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
          zip.file(audioFileName, audioBlob);
        } catch (error) {
          console.error(`Error downloading ${file.name}:`, error);
          throw error;
        }
      });

      await Promise.all(downloadPromises);
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'transcribed_audio.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      dispatch(setGlobalMessage('Download complete!'));
      setTimeout(() => dispatch(clearGlobalMessage()), 3000);
    } catch (error) {
      console.error('Error creating zip file:', error);
      dispatch(setGlobalMessage('Failed to create ZIP file. Please try again.'));
      setTimeout(() => dispatch(clearGlobalMessage()), 5000);
    } finally {
      dispatch(setIsDownloading(false));
    }
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearAllFiles());
    dispatch(clearGlobalMessage());
  }, [dispatch]);

  const handleVoiceChange = useCallback((voice: string) => {
    dispatch(setSelectedVoice(voice));
  }, [dispatch]);

  const handleSpeedChange = useCallback((speed: number) => {
    dispatch(setSelectedSpeed(speed));
  }, [dispatch]);

  const handleDownloadSingle = useCallback(async (file: ProcessedFile) => {
    if (!file.audioSrc) return;

    try {
      const response = await fetch(file.audioSrc);
      if (!response.ok) throw new Error(`Failed to download ${file.name}`);
      
      const audioBlob = await response.blob();
      const audioFileName = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
      
      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = audioFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(`Error downloading ${file.name}:`, error);
      dispatch(setGlobalMessage(`Failed to download ${file.name}. Please try again.`));
      setTimeout(() => dispatch(clearGlobalMessage()), 3000);
    }
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-4 sm:p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <DocumentTextIcon className="w-10 h-10 text-sky-400" />
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
            Text-to-Audio
          </h1>
        </div>
        <p className="text-slate-400 text-lg">Upload .txt files or ZIP archives to convert text to speech.</p>
      </header>

      <main className="w-full max-w-3xl bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8">
        <FileUpload onFilesSelected={handleFilesSelected} isLoading={isReadingFiles || isTranscribing} />

        <SettingsControls
            availableVoices={availableVoices}
            selectedVoice={selectedVoice}
            onVoiceChange={handleVoiceChange}
            selectedSpeed={selectedSpeed}
            onSpeedChange={handleSpeedChange}
            isLoadingVoices={isLoadingVoices}
            isDisabled={isReadingFiles || isTranscribing}
        />

        {/* Progress indicator for transcription */}
        {isTranscribing && transcriptionProgress.total > 0 && (
          <div className="mt-6 text-center text-sky-400">
            <p>
              Transcribing {transcriptionProgress.currentFileName || 'files'} 
              ({transcriptionProgress.current} of {transcriptionProgress.total})
            </p>
            <div className="mt-2 h-2 w-full bg-sky-500/30 rounded-full overflow-hidden">
              <div 
                className="h-2 bg-sky-500 transition-all duration-300"
                style={{ width: `${(transcriptionProgress.current / transcriptionProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {(isReadingFiles || isTranscribing || isDownloading || globalMessage) && (
          <div className="mt-6 text-center text-sky-400">
            <p>{globalMessage || (isReadingFiles ? "Processing uploaded files..." : isTranscribing ? "Transcribing files..." : isDownloading ? "Preparing download..." : "")}</p>
            {(isReadingFiles || isDownloading) && <div className="mt-2 h-1 w-full bg-sky-500/30 rounded-full overflow-hidden"><div className="h-1 animate-pulse bg-sky-500 w-1/2"></div></div>}
          </div>
        )}

        {processedFiles.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-slate-200">Files to Process</h2>
              <div className="space-x-3">
                <button
                  onClick={handleClearAll}
                  disabled={!canClear}
                  className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={!canDownload}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download All</span>
                </button>
                <button
                  onClick={handleStartTranscription}
                  disabled={!canTranscribe}
                  className="px-6 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <ArrowUpTrayIcon className="w-4 h-4 transform rotate-90" />
                  <span>Transcribe Ready Files</span>
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {processedFiles.map((file: ProcessedFile) => (
                <FileListItem 
                  key={file.id} 
                  file={file}
                  onDownload={handleDownloadSingle}
                />
              ))}
            </div>
          </div>
        )}
         {processedFiles.length === 0 && !isReadingFiles && (
            <div className="mt-8 text-center text-slate-500">
                <p>Upload files to get started.</p>
            </div>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Text-to-Audio Transcriber. Powered by Kokoro TTS.</p>
      </footer>
    </div>
  );
};

export default App;
