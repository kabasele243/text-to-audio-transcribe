
import React from 'react';

interface SettingsControlsProps {
  availableVoices: string[];
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
  isLoadingVoices: boolean;
  isDisabled: boolean;
}

const speedOptions = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x (Normal)', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2.0x', value: 2.0 },
];

export const SettingsControls: React.FC<SettingsControlsProps> = ({
  availableVoices,
  selectedVoice,
  onVoiceChange,
  selectedSpeed,
  onSpeedChange,
  isLoadingVoices,
  isDisabled,
}) => {
  return (
    <div className={`mt-6 p-4 bg-slate-700/30 rounded-lg shadow ${isDisabled ? 'opacity-70' : ''}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="voice-select" className="block text-sm font-medium text-slate-300 mb-1">
            Voice
          </label>
          <select
            id="voice-select"
            name="voice"
            value={selectedVoice}
            onChange={(e) => onVoiceChange(e.target.value)}
            disabled={isLoadingVoices || isDisabled || availableVoices.length === 0}
            className="w-full p-2 bg-slate-600 border border-slate-500 text-slate-100 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby="voice-loading-status"
          >
            {isLoadingVoices && <option value="">Loading voices...</option>}
            {!isLoadingVoices && availableVoices.length === 0 && <option value="">No voices available</option>}
            {!isLoadingVoices &&
              availableVoices.map((voice) => (
                <option key={voice} value={voice}>
                  {voice}
                </option>
              ))}
          </select>
          {isLoadingVoices && <p id="voice-loading-status" className="text-xs text-sky-400 mt-1">Fetching voices...</p>}
        </div>

        <div>
          <label htmlFor="speed-select" className="block text-sm font-medium text-slate-300 mb-1">
            Speed
          </label>
          <select
            id="speed-select"
            name="speed"
            value={selectedSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            disabled={isDisabled}
            className="w-full p-2 bg-slate-600 border border-slate-500 text-slate-100 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {speedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
