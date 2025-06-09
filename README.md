# Text-to-Audio Transcriber

A modern web application that converts text files to speech using the Kokoro TTS API.

## Features

-   Upload individual `.txt` files or ZIP archives containing multiple text files.
-   Convert text to speech with customizable voice and speed settings.
-   Batch processing of multiple files with real-time progress tracking.
-   Download all converted audio files as a convenient ZIP archive.

## Setup

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd text-to-audio-transcriber
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

## Usage

1.  Open the application in your browser
2.  Upload text files (.txt) or ZIP archives containing text files
3.  Select your preferred voice and playback speed
4.  Click "Transcribe Ready Files" to convert text to audio
5.  Download individual audio files or use "Download All" for a ZIP archive

## Technologies Used

-   **React** with TypeScript for the frontend
-   **Vite** for build tooling and development server
-   **Tailwind CSS** for styling
-   **JSZip** for handling ZIP file operations
-   **Kokoro TTS API** for text-to-speech conversion

## Browser Compatibility

This application works in all modern browsers that support ES6+ features and the Fetch API.
