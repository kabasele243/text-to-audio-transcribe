
export type FileStatus = 'pending' | 'reading' | 'ready' | 'processing' | 'transcribed' | 'error';

export interface ProcessedFile {
  id: string;
  name: string;
  content: string;
  status: FileStatus;
  audioSrc?: string;
  error?: string;
}