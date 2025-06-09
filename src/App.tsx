import React, { useState, useCallback, useEffect } from 'react';
import JSZip from 'jszip';
import { FileUpload } from './components/FileUpload';
import { FileListItem } from './components/FileListItem';
import { SettingsControls } from './components/SettingsControls';
import { transcribeText, fetchAvailableVoices, TranscriptionResult } from './services/transcriptionService';
import type { ProcessedFile, FileStatus } from './types';
import { ArrowUpTrayIcon } from './components/icons/ArrowUpTrayIcon';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';

const App: React.FC = () => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const [selectedVoice, setSelectedVoice] = useState<string>('am_michael');
  const [availableVoices, setAvailableVoices] = useState<string[]>(['am_michael']);
  const [isLoadingVoices, setIsLoadingVoices] = useState<boolean>(true);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1.0);

  useEffect(() => {
    const loadVoices = async () => {
      setIsLoadingVoices(true);
      try {
        const voices = await fetchAvailableVoices();
        // Ensure 'am_michael' is in the list and set as default if available
        // Also handle if fetchAvailableVoices returns an empty array or specific defaults
        const uniqueVoices = Array.from(new Set(['am_michael', ...voices]));
        setAvailableVoices(uniqueVoices);
        if (uniqueVoices.includes('am_michael')) {
          setSelectedVoice('am_michael');
        } else if (uniqueVoices.length > 0) {
          setSelectedVoice(uniqueVoices[0]); // Fallback to first available if am_michael isn't there
        }
        // If voices array is empty after fetch (e.g. API returns empty or error fallback is empty)
        // it will remain with initial ['am_michael'] or whatever fetchAvailableVoices error fallback provides.
      } catch (error) {
        console.error("Failed to load voices, using default:", error);
        // Keep 'am_michael' as default if loading fails
        if (!availableVoices.includes('am_michael')) {
            setAvailableVoices(prev => Array.from(new Set(['am_michael', ...prev])));
        }
         setSelectedVoice('am_michael');
      } finally {
        setIsLoadingVoices(false);
      }
    };
    loadVoices();
  }, []);


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
    setIsReadingFiles(true);
    setGlobalMessage(`Reading ${files.length} item(s)...`);

    const newFilesToProcess: ProcessedFile[] = [];

    for (const file of files) {
      setGlobalMessage(`Processing ${file.name}...`);
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
              setGlobalMessage(`Extracting ${zipEntry.name} from ${file.name}...`);
              const promise = zipEntry.async('string').then(content => ({
                id: crypto.randomUUID(),
                name: zipEntry.name,
                content,
                status: 'ready' as FileStatus,
              })).catch(err => {
                console.error(`Error reading ${zipEntry.name} from zip:`, err);
                return {
                  id: crypto.randomUUID(),
                  name: zipEntry.name,
                  content: '',
                  status: 'error' as FileStatus,
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
    setProcessedFiles(prev => [...prev, ...newFilesToProcess]);
    setIsReadingFiles(false);
    setGlobalMessage(null);
  }, []);

  const handleStartTranscription = useCallback(async () => {
    const filesToTranscribe = processedFiles.filter(f => f.status === 'ready');
    if (filesToTranscribe.length === 0) return;

    setIsTranscribing(true);
    setGlobalMessage(`Starting transcription of ${filesToTranscribe.length} file(s)...`);

    // Process files one at a time
    for (const file of filesToTranscribe) {
      // Update status to processing for current file
      setProcessedFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === file.id ? { ...f, status: 'processing' } : f
        )
      );

      setGlobalMessage(`Transcribing ${file.name} with voice: ${selectedVoice}, speed: ${selectedSpeed}x...`);

      try {
        const result: TranscriptionResult = await transcribeText(file.content, file.name, selectedVoice, selectedSpeed);
        
        // Update the processed file with success status
        setProcessedFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === file.id ? { ...f, status: 'transcribed', audioSrc: result.audioSrc } : f
          )
        );
        
        setGlobalMessage(`Successfully transcribed ${file.name}`);
        // Short pause to show success message
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error transcribing file ${file.name}:`, error);
        
        // Update the processed file with error status
        setProcessedFiles(prevFiles =>
          prevFiles.map(f =>
            f.id === file.id ? { ...f, status: 'error', error: `Transcription failed: ${error instanceof Error ? error.message : String(error)}` } : f
          )
        );
        
        setGlobalMessage(`Failed to transcribe ${file.name}`);
        // Short pause to show error message
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsTranscribing(false);
    setGlobalMessage("All transcriptions completed.");
    setTimeout(() => setGlobalMessage(null), 5000);
  }, [processedFiles, selectedVoice, selectedSpeed]);

  const handleDownloadAll = useCallback(async () => {
    const transcribedFiles = processedFiles.filter(f => f.status === 'transcribed' && f.audioSrc);
    if (transcribedFiles.length === 0) return;

    setIsDownloading(true);
    setGlobalMessage('Preparing ZIP file for download...');

    try {
      const zip = new JSZip();
      
      // Download all audio files and add them to the zip
      const downloadPromises = transcribedFiles.map(async (file) => {
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
      
      setGlobalMessage('Download complete!');
      setTimeout(() => setGlobalMessage(null), 3000);
    } catch (error) {
      console.error('Error creating zip file:', error);
      setGlobalMessage('Failed to create ZIP file. Please try again.');
      setTimeout(() => setGlobalMessage(null), 5000);
    } finally {
      setIsDownloading(false);
    }
  }, [processedFiles]);

  const handleClearAll = () => {
    setProcessedFiles([]);
    setGlobalMessage(null);
  };

  const canTranscribe = processedFiles.some(f => f.status === 'ready') && !isTranscribing && !isReadingFiles;
  const canClear = processedFiles.length > 0 && !isTranscribing && !isReadingFiles;
  const canDownload = processedFiles.some(f => f.status === 'transcribed' && f.audioSrc) && !isDownloading && !isTranscribing && !isReadingFiles;

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
            onVoiceChange={setSelectedVoice}
            selectedSpeed={selectedSpeed}
            onSpeedChange={setSelectedSpeed}
            isLoadingVoices={isLoadingVoices}
            isDisabled={isReadingFiles || isTranscribing}
        />

        {(isReadingFiles || isTranscribing || isDownloading || globalMessage) && (
          <div className="mt-6 text-center text-sky-400">
            <p>{globalMessage || (isReadingFiles ? "Processing uploaded files..." : isTranscribing ? "Transcribing files..." : isDownloading ? "Preparing download..." : "")}</p>
            {(isReadingFiles || isTranscribing || isDownloading) && <div className="mt-2 h-1 w-full bg-sky-500/30 rounded-full overflow-hidden"><div className="h-1 animate-pulse bg-sky-500 w-1/2"></div></div>}
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
              {processedFiles.map((file) => (
                <FileListItem key={file.id} file={file} />
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
