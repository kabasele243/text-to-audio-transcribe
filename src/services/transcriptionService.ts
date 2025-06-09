// Assuming the API is served from the same origin as the frontend.
// If it's on a different port (e.g., http://localhost:8000), this needs to be adjusted.
const API_BASE_URL = 'http://localhost:8880'; // Relative to current host, e.g., /api if proxied

export interface TranscriptionResult {
  audioSrc: string;
}

export interface AvailableVoicesResponse {
  voices: string[]; // Assuming the API returns an object with a "voices" array
}

export const transcribeText = async (
  text: string,
  fileName: string,
  voice: string,
  speed: number
): Promise<TranscriptionResult> => {
  console.log(`Transcribing ${fileName} with voice: ${voice}, speed: ${speed} using Kokoro API...`);

  if (!text || text.trim().length === 0) {
    throw new Error(`Cannot transcribe empty text for ${fileName}.`);
  }

  const requestBody = {
    input: text,
    model: "kokoro", // As per OpenAPI default
    voice: voice, // Use selected voice
    speed: speed, // Use selected speed
    response_format: "mp3", // As per OpenAPI default
    stream: false, // We need a download link, not a stream of audio chunks here
    return_download_link: true, // To get the X-Download-Path header
  };

  try {
    const response = await fetch(`${API_BASE_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorBodyMessage = `API request failed for ${fileName} with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail) && errorData.detail.length > 0 && errorData.detail[0].msg) {
            errorBodyMessage += `: ${errorData.detail[0].msg}`;
          } else if (typeof errorData.detail === 'string') {
            errorBodyMessage += `: ${errorData.detail}`;
          } else {
             errorBodyMessage += `: ${JSON.stringify(errorData.detail)}`;
          }
        } else {
          errorBodyMessage += `: ${response.statusText}`;
        }
      } catch (e) {
        // Failed to parse error JSON, use statusText
        errorBodyMessage += `: ${response.statusText}`;
      }
      throw new Error(errorBodyMessage);
    }

    // Check if we got an audio file directly
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('audio/')) {
      // Create a blob from the response and generate a local URL
      const blob = await response.blob();
      const audioSrc = URL.createObjectURL(blob);
      return { audioSrc };
    }

    // Fallback to checking for download path header
    const downloadPath = response.headers.get('X-Download-Path');
    if (downloadPath) {
      const audioSrc = API_BASE_URL + downloadPath;
      return { audioSrc };
    }
    
    throw new Error(`API response format not recognized for ${fileName}. Expected either audio content or a download path.`);

  } catch (error) {
    console.error(`Error transcribing text for ${fileName}:`, error);
    if (error instanceof Error) {
      const message = error.message.startsWith('API request failed') || error.message.includes('X-Download-Path')
        ? error.message
        : `Transcription failed for ${fileName}: ${error.message}`;
      throw new Error(message);
    }
    throw new Error(`Transcription failed for ${fileName}: An unknown error occurred.`);
  }
};

export const fetchAvailableVoices = async (): Promise<string[]> => {
  console.log("Fetching available voices from Kokoro API...");
  try {
    const response = await fetch(`${API_BASE_URL}/v1/audio/voices`);
    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status} ${response.statusText}`);
    }
    // The OpenAPI spec for /v1/audio/voices is vague (schema: {}).
    // We assume it returns a JSON object like {"voices": ["voice1", "voice2", ...]}
    // or just an array of voice strings.
    // For robustness, let's try to parse common structures.
    const data = await response.json();

    if (Array.isArray(data)) { // Case 1: data is ["voice1", "voice2"]
        return data.filter(v => typeof v === 'string');
    }
    if (data && Array.isArray(data.voices) && data.voices.every((v: any) => typeof v === 'string')) { // Case 2: data is { voices: ["voice1", "voice2"] }
        return data.voices;
    }
     if (data && Array.isArray(data.voices) && data.voices.every((v: any) => typeof v?.id === 'string')) { // Case 3: data is { voices: [{id: "voice1", name: "Voice 1"}, ...] }
        return data.voices.map((v: any) => v.id);
    }

    console.warn("Unexpected format for available voices:", data);
    // Fallback if the structure is unknown but data exists
    if (typeof data === 'object' && data !== null) {
        const voiceKeys = Object.keys(data).filter(key => Array.isArray((data as any)[key]));
        if (voiceKeys.length > 0 && Array.isArray((data as any)[voiceKeys[0]])) {
             const potentialVoices = (data as any)[voiceKeys[0]];
             if (potentialVoices.every((v: any) => typeof v === 'string')) return potentialVoices;
             if (potentialVoices.every((v: any) => typeof v?.id === 'string')) return potentialVoices.map((v:any) => v.id);
        }
    }

    throw new Error("Unexpected format for available voices response.");

  } catch (error) {
    console.error("Error fetching available voices:", error);
    // Fallback to a default list if fetching fails
    return ['am_michael', 'af_heart']; // Ensure am_michael is available
  }
};
