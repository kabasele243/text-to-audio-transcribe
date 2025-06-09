# State Persistence Setup

This application uses Redux Persist to maintain user preferences across browser sessions.

## What Gets Persisted

Only **user settings** are persisted to localStorage:
- `selectedVoice` - The user's preferred voice selection
- `selectedSpeed` - The user's preferred playback speed

## What Doesn't Get Persisted

- **File data** - Uploaded files are not persisted for performance and privacy reasons
- **UI state** - Temporary UI messages and loading states are not persisted
- **Available voices list** - Refreshed on each app start
- **Transcription progress** - Temporary processing state

## How It Works

1. **Storage Location**: Uses browser's localStorage
2. **Storage Key**: Data is stored under the key `persist:settings`
3. **Automatic Rehydration**: Settings are automatically restored when the app starts
4. **Automatic Persistence**: Changes to settings are automatically saved

## Available Utilities

Import from `src/store/persistUtils.ts`:

```typescript
import { 
  clearPersistedData, 
  isRehydrated, 
  getPersistenceState, 
  flushPersistence 
} from './store/persistUtils';

// Clear all persisted data
await clearPersistedData();

// Check if data has been loaded from storage
const isLoaded = isRehydrated();

// Get persistence status
const status = getPersistenceState();

// Manually save current state (usually automatic)
await flushPersistence();
```

## Settings Actions

```typescript
import { resetSettings } from './store/slices/settingsSlice';

// Reset user settings to defaults
dispatch(resetSettings());
```

## Implementation Details

- Uses `redux-persist` with localStorage adapter
- Configured with whitelist to only persist specific fields
- Wrapped with `PersistGate` component for loading state
- Ignores Redux Persist actions in serializable check
- TypeScript fully supported

## Browser Compatibility

Works in all modern browsers that support localStorage:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- IE 8+
- Edge (all versions)

## Data Size

Current persisted data is minimal (~100 bytes) and won't impact browser performance. 