import { persistor } from './index';

/**
 * Utility functions for managing persisted state
 */

/**
 * Clear all persisted data and reset the store to initial state
 */
export const clearPersistedData = async (): Promise<void> => {
  try {
    await persistor.purge();
    console.log('Persisted data cleared successfully');
  } catch (error) {
    console.error('Failed to clear persisted data:', error);
    throw error;
  }
};

/**
 * Check if the store has been rehydrated from persisted state
 */
export const isRehydrated = (): boolean => {
  return persistor.getState().bootstrapped;
};

/**
 * Get the current persistence state
 */
export const getPersistenceState = () => {
  return persistor.getState();
};

/**
 * Manually trigger state persistence (usually happens automatically)
 */
export const flushPersistence = (): Promise<void> => {
  return persistor.flush();
}; 