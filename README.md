# Text-to-Audio Transcriber

A modern web application that converts text files to speech using the Kokoro TTS API. Upload individual `.txt` files or ZIP archives containing multiple text files, and convert them to high-quality audio with customizable voice and speed settings.

## ✨ Features

- **Flexible File Upload**: Upload individual `.txt` files or ZIP archives containing multiple text files
- **Batch Processing**: Convert multiple files simultaneously with real-time progress tracking
- **Voice Customization**: Choose from available Kokoro TTS voices
- **Speed Control**: Adjust playback speed to your preference
- **Download Options**: Download individual audio files or get all files as a convenient ZIP archive
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Kokoro TTS API server running on `http://localhost:8880`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/text-to-audio-transcriber.git
   cd text-to-audio-transcriber
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API endpoint (if needed):**
   
   The application expects the Kokoro TTS API to be running on `http://localhost:8880`. If your API is running on a different URL, update the `API_BASE_URL` in `src/services/transcriptionService.ts`:
   
   ```typescript
   const API_BASE_URL = 'http://your-api-host:port';
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173` (or the URL shown in your terminal)

## 📖 Usage

1. **Upload Files**: Click the upload area to select `.txt` files or ZIP archives containing text files
2. **Configure Settings**: 
   - Choose your preferred voice from the dropdown
   - Adjust the playback speed using the slider (0.5x to 2.0x)
3. **Process Files**: Click "Transcribe Ready Files" to start the conversion
4. **Monitor Progress**: Watch the real-time progress indicator for batch processing
5. **Download Audio**: 
   - Download individual files as they complete
   - Use "Download All" to get a ZIP archive with all converted audio files

## 🏗️ Project Structure

```
text-to-audio-transcriber/
├── src/
│   ├── components/          # React components
│   ├── services/           
│   │   └── transcriptionService.ts  # API integration logic
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── index.tsx           # Application entry point
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🔧 API Configuration

### Kokoro TTS API Requirements

The application requires a Kokoro TTS API server with the following endpoints:

- `POST /v1/audio/speech` - Convert text to speech
- `GET /v1/audio/voices` - Get available voices

### Expected API Response Format

**Speech Generation (`/v1/audio/speech`)**:
- Returns audio content directly with `Content-Type: audio/*`, OR
- Returns a response with `X-Download-Path` header containing the download URL

**Voice List (`/v1/audio/voices`)**:
- Returns an array of voice strings: `["voice1", "voice2"]`, OR  
- Returns an object: `{"voices": ["voice1", "voice2"]}`, OR
- Returns an object with voice objects: `{"voices": [{"id": "voice1", "name": "Voice 1"}]}`

## 🎨 Technologies Used

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for utility-first styling
- **File Processing**: JSZip for handling ZIP file operations
- **HTTP Client**: Native Fetch API for API communication
- **Development**: ESLint for code quality and consistency

## 🌐 Browser Compatibility

This application works in all modern browsers that support:
- ES6+ JavaScript features
- Fetch API
- File API
- Blob API
- URL.createObjectURL()

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Common Issues

**"API request failed" Error**
- Ensure the Kokoro TTS API server is running on `http://localhost:8880`
- Check if the API endpoints `/v1/audio/speech` and `/v1/audio/voices` are accessible
- Verify the API server supports CORS for your frontend domain

**"Cannot transcribe empty text" Error**
- Make sure your `.txt` files contain text content
- Check that ZIP files contain valid `.txt` files with content

**Voice Selection Not Loading**
- The app will fall back to default voices (`am_michael`, `af_heart`) if the API is unreachable
- Check browser console for API connection errors

**File Upload Issues**
- Only `.txt` files and `.zip` archives containing `.txt` files are supported
- Maximum file size depends on your browser's memory limitations

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API server is running and accessible
3. Ensure all dependencies are properly installed
4. Try refreshing the browser page

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

**Note**: Make sure you have a compatible Kokoro TTS API server running before using this application.
